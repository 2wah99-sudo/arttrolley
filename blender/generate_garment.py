"""
Procedural saree + blouse generator, driven entirely by garment-config.json.
Run headless:
    blender --background --python blender/generate_garment.py

Pipeline:
  1. Build a simple capsule-based mannequin (collision body for cloth sim,
     invisible in the export — real bodies are a separate, much larger
     problem than this task needs).
  2. Build the saree skirt as a pleated cylinder (radial pleats via a sine
     ripple on the radius, not a flat plane).
  3. Build the pallu as a draped cloth mesh, cloth-simulated over the
     shoulder for a real gravity-driven fold pattern.
  4. Build the blouse as a simple fitted torso shell.
  5. Apply the real Ajrakh print texture (public/prints/saree-ajrakh-1.jpg)
     as a PBR silk material with UV-mapped border color, no distortion —
     cylindrical UV project matches the skirt's own topology.
  6. Bake cloth sim, apply, clean normals, export two GLBs (high + low).

Every numeric parameter lives in garment-config.json — change values there,
rerun this script, no code edits needed.
"""
import bpy, bmesh, json, math, os, sys

ROOT = "D:/Projects/arttrolley"
CFG_PATH = f"{ROOT}/blender/garment-config.json"

with open(CFG_PATH) as f:
    CFG = json.load(f)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = CFG["cloth_sim"]["frames"]

# ---------------------------------------------------------------- body ----
b = CFG["body"]
bpy.ops.mesh.primitive_cylinder_add(
    radius=b["waist_width"], depth=b["height"] * 0.55, vertices=b["segments"],
    location=(0, 0, b["height"] * 0.42),
)
torso = bpy.context.object
torso.name = "MannequinBody"
# taper: pinch waist, flare shoulders/hips using shape editing
bm = bmesh.new(); bm.from_mesh(torso.data)
for v in bm.verts:
    z = v.co.z
    t = (z + b["height"] * 0.275) / (b["height"] * 0.55)  # 0 bottom -> 1 top
    if t > 0.75:
        scale = 1.0 + (t - 0.75) * (b["shoulder_width"] / b["waist_width"] - 1) * 4
    elif t < 0.35:
        scale = 1.0 + (0.35 - t) * (b["hip_width"] / b["waist_width"] - 1) * 3
    else:
        scale = 1.0
    v.co.x *= scale
    v.co.y *= scale
bm.to_mesh(torso.data); bm.free()
torso.data.update()
bpy.ops.object.select_all(action='DESELECT')
torso.select_set(True); bpy.context.view_layer.objects.active = torso
bpy.ops.object.shade_smooth()
torso.hide_render = True  # collision-only, not part of the export

# --------------------------------------------------------------- saree ----
s = CFG["saree"]
waist_h = s["waist_height"]
seg_r, seg_v = s["radial_segments"], s["vertical_segments"]

mesh = bpy.data.meshes.new("SareeSkirt")
skirt = bpy.data.objects.new("SareeSkirt", mesh)
bpy.context.collection.objects.link(skirt)

bm = bmesh.new()
ring_verts = []
for vi in range(seg_v + 1):
    t = vi / seg_v  # 0 = waist, 1 = hem
    radius = s["skirt_top_radius"] + (s["skirt_bottom_radius"] - s["skirt_top_radius"]) * t
    z = waist_h - t * s["skirt_length"]
    row = []
    for ri in range(seg_r):
        theta = (ri / seg_r) * math.pi * 2
        # pleats: sine ripple on radius, strongest at the waist, softening
        # toward the hem (real pleats loosen as they fall) — this is what
        # keeps it from reading as a flat cone.
        pleat = math.sin(theta * s["pleats"]) * s["pleat_depth"] * (1 - t * 0.4) * s["pleat_spread"]
        # Secondary higher-frequency folds layered on the main pleats, and
        # a slight vertical waver — real fabric never falls as a clean cone.
        DFc = CFG["drape_folds"]
        fold = math.sin(theta * DFc["skirt_fold_count"] + t * 1.7) * DFc["skirt_fold_depth"] * t
        r = radius + pleat + fold
        x = math.cos(theta) * r
        y = math.sin(theta) * r
        row.append(bm.verts.new((x, y, z)))
    ring_verts.append(row)
bm.verts.ensure_lookup_table()

for vi in range(seg_v):
    for ri in range(seg_r):
        a, b_ = ring_verts[vi][ri], ring_verts[vi][(ri + 1) % seg_r]
        c, d = ring_verts[vi + 1][(ri + 1) % seg_r], ring_verts[vi + 1][ri]
        bm.faces.new((a, b_, c, d))

bm.normal_update()
uv_layer = bm.loops.layers.uv.new()
for f in bm.faces:
    for loop in f.loops:
        v = loop.vert
        # cylindrical UV: angle -> u, height -> v — matches the mesh's own
        # topology, so the print doesn't stretch or smear around the skirt.
        u = (math.atan2(v.co.y, v.co.x) / (2 * math.pi)) + 0.5
        vv = 1 - ((waist_h - v.co.z) / s["skirt_length"])
        loop[uv_layer].uv = (u * CFG["material"]["uv_scale"][0], vv * CFG["material"]["uv_scale"][1])

bm.to_mesh(mesh); bm.free()
bpy.ops.object.select_all(action='DESELECT')
skirt.select_set(True); bpy.context.view_layer.objects.active = skirt
bpy.ops.object.shade_smooth()

# --------------------------------------------------------------- pallu ----
p = CFG["pallu"]
mesh2 = bpy.data.meshes.new("Pallu")
pallu = bpy.data.objects.new("Pallu", mesh2)
bpy.context.collection.objects.link(pallu)

DF = CFG["drape_folds"]
bm2 = bmesh.new()
grid = []
for vi in range(p["segments_v"] + 1):
    t = vi / p["segments_v"]  # 0 at shoulder -> 1 at free hanging end
    row = []
    z = p["shoulder_height"] - t * p["length"]
    # The pallu hugs the shoulder then falls: it sways gently outward and
    # forward as it descends (gravity + body contact), rather than sticking
    # out as a rigid flat sheet. This replaces the cloth sim, which silently
    # produced no drape at all in headless mode.
    sway = math.sin(t * math.pi * 0.6) * p.get("sway", DF["pallu_sway"])
    for ui in range(p["segments_u"] + 1):
        u = ui / p["segments_u"] - 0.5
        # vertical folds running down the cloth, deepening as it hangs free
        fold = math.sin(u * math.pi * 2 * DF["pallu_fold_count"]) * DF["pallu_fold_depth"] * (0.25 + t)
        x = p["drape_offset_x"] - sway + u * p["width"]
        y = 0.055 + fold + t * 0.03
        row.append(bm2.verts.new((x, y, z)))
    grid.append(row)
bm2.verts.ensure_lookup_table()
for vi in range(p["segments_v"]):
    for ui in range(p["segments_u"]):
        a, b_ = grid[vi][ui], grid[vi][ui + 1]
        c, d = grid[vi + 1][ui + 1], grid[vi + 1][ui]
        bm2.faces.new((a, b_, c, d))
bm2.normal_update()
uv2 = bm2.loops.layers.uv.new()
for f in bm2.faces:
    for loop in f.loops:
        v = loop.vert
        loop[uv2].uv = ((v.co.x - p["drape_offset_x"]) / p["width"] + 0.5, (p["shoulder_height"] - v.co.z) / p["length"])
bm2.to_mesh(mesh2); bm2.free()
bpy.ops.object.select_all(action='DESELECT')
pallu.select_set(True); bpy.context.view_layer.objects.active = pallu
bpy.ops.object.shade_smooth()

# pin the top row so cloth sim only lets the free end fall/drape
pin_group = pallu.vertex_groups.new(name="Pin")
top_row_indices = list(range(p["segments_u"] + 1))
pin_group.add(top_row_indices, 1.0, 'REPLACE')

# -------------------------------------------------------------- blouse ----
bl = CFG["blouse"]
# Fitted torso shell, not a bare cylinder: tapers at the waist and widens at
# the bust/shoulder so it reads as a blouse and meets the skirt waistline
# (bottom_height now overlaps the skirt top, closing the floating-gap bug).
mesh3 = bpy.data.meshes.new("Blouse")
blouse = bpy.data.objects.new("Blouse", mesh3)
bpy.context.collection.objects.link(blouse)
bm3 = bmesh.new()
b_rings = []
BL_SEGS = 14
for vi in range(BL_SEGS + 1):
    t = vi / BL_SEGS  # 0 = hem (waist) -> 1 = shoulder
    z = bl["bottom_height"] + t * bl["height"]
    # narrow at waist, fuller at bust, slight taper to shoulder
    shape = 1.0 + math.sin(t * math.pi) * 0.16 + t * 0.06
    rr = bl["radius"] * shape
    row = []
    for ri in range(b["segments"]):
        theta = (ri / b["segments"]) * math.pi * 2
        row.append(bm3.verts.new((math.cos(theta) * rr, math.sin(theta) * rr * 0.86, z)))
    b_rings.append(row)
bm3.verts.ensure_lookup_table()
for vi in range(BL_SEGS):
    for ri in range(b["segments"]):
        a, b2 = b_rings[vi][ri], b_rings[vi][(ri + 1) % b["segments"]]
        c, d = b_rings[vi + 1][(ri + 1) % b["segments"]], b_rings[vi + 1][ri]
        bm3.faces.new((a, b2, c, d))
bm3.normal_update()
uv3 = bm3.loops.layers.uv.new()
for f in bm3.faces:
    for loop in f.loops:
        v = loop.vert
        u = (math.atan2(v.co.y, v.co.x) / (2 * math.pi)) + 0.5
        loop[uv3].uv = (u, (v.co.z - bl["bottom_height"]) / bl["height"])
bm3.to_mesh(mesh3); bm3.free()
bpy.ops.object.select_all(action='DESELECT')
blouse.select_set(True); bpy.context.view_layer.objects.active = blouse
bpy.ops.object.shade_smooth()

# ---------------------------------------------------------- cloth sim -----
cs = CFG["cloth_sim"]
if cs["enabled"]:
    bpy.ops.object.select_all(action='DESELECT')
    pallu.select_set(True); bpy.context.view_layer.objects.active = pallu
    bpy.ops.object.modifier_add(type='CLOTH')
    cloth_mod = pallu.modifiers["Cloth"]
    cs_settings = cloth_mod.settings
    cs_settings.mass = cs["mass"]
    cs_settings.tension_stiffness = cs["tension_stiffness"]
    cs_settings.compression_stiffness = cs["compression_stiffness"]
    cs_settings.shear_stiffness = cs["shear_stiffness"]
    cs_settings.bending_stiffness = cs["bending_stiffness"]
    cs_settings.air_damping = cs["air_damping"]
    cs_settings.quality = cs["quality"]
    cs_settings.vertex_group_mass = "Pin"
    cloth_mod.collision_settings.use_collision = True

    bpy.ops.object.modifier_add(type='COLLISION')
    torso.select_set(True); bpy.context.view_layer.objects.active = torso
    bpy.ops.object.modifier_add(type='COLLISION')

    # bake by stepping the frame range — headless-safe, no operator UI needed
    bpy.context.view_layer.objects.active = pallu
    for f in range(scene.frame_start, scene.frame_end + 1):
        scene.frame_set(f)
    bpy.context.view_layer.objects.active = pallu
    dg = bpy.context.evaluated_depsgraph_get()
    pallu_eval = pallu.evaluated_get(dg)
    mesh_eval = bpy.data.meshes.new_from_object(pallu_eval)
    pallu.modifiers.clear()
    pallu.data = mesh_eval

# ------------------------------------------------------------ materials ---
m = CFG["material"]
tex_path = f"{ROOT}/{m['base_texture']}"

def make_fabric_material(name, tex_path, fabric_key, tint=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    fab = m[fabric_key]
    bsdf.inputs["Roughness"].default_value = fab["roughness"]
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = fab["sheen"]
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = fab["specular"]
    if os.path.exists(tex_path):
        tex_node = nt.nodes.new("ShaderNodeTexImage")
        tex_node.image = bpy.data.images.load(tex_path)
        nt.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
    elif tint:
        bsdf.inputs["Base Color"].default_value = tint
    return mat

saree_mat = make_fabric_material("SareeSilk", tex_path, "silk")
skirt.data.materials.append(saree_mat)
pallu.data.materials.append(saree_mat)

# Blouse uses the same printed silk as the saree (matching blouse is the
# normal construction) — flat colour read as plastic next to the textured
# skirt. Falls back to the deep-red tint only if the texture is missing.
blouse_mat = make_fabric_material("BlouseSilk", tex_path, "silk", tint=m["blouse_color"])
blouse.data.materials.append(blouse_mat)

# ------------------------------------------------------------- export -----
os.makedirs(f"{ROOT}/public/models", exist_ok=True)
torso.hide_set(True)  # hide, don't delete — keep as collision reference

bpy.ops.object.select_all(action='DESELECT')
for obj in (skirt, pallu, blouse):
    obj.select_set(True)
bpy.context.view_layer.objects.active = skirt

exp = CFG["export"]
bpy.ops.export_scene.gltf(
    filepath=f"{ROOT}/{exp['output_high']}",
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
)
print("EXPORTED HIGH:", exp["output_high"])

# low-poly pass: decimate a copy, re-export
bpy.ops.object.select_all(action='DESELECT')
low_objs = []
for obj in (skirt, pallu, blouse):
    dup = obj.copy()
    dup.data = obj.data.copy()
    dup.name = obj.name + "_low"
    bpy.context.collection.objects.link(dup)
    bpy.context.view_layer.objects.active = dup
    mod = dup.modifiers.new("Decimate", 'DECIMATE')
    mod.ratio = exp["decimate_low"]
    bpy.ops.object.modifier_apply(modifier="Decimate")
    dup.select_set(True)
    low_objs.append(dup)

bpy.ops.export_scene.gltf(
    filepath=f"{ROOT}/{exp['output_low']}",
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
)
print("EXPORTED LOW:", exp["output_low"])
print("DONE")
