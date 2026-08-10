"""
Procedural KURTI generator — reusable across garment configs.

    blender --background --python blender/generate_kurti.py -- config/kurti_01.json

Design notes:
  * Geometry is deterministic and procedural. Blender cloth sim is NOT used:
    it silently no-opped headless on this machine (2 cores / 8GB / no CUDA)
    and is not worth the runtime. Drape is produced by layering three scales
    of fold displacement instead, which is instant and reproducible.
  * The body is built as a stack of elliptical rings lofted together, so the
    silhouette (chest/waist/hip/hem) is driven purely by config values.
  * Neckline, collar, sleeves and side slits are REAL geometry — none of them
    are painted into the texture.
"""
import bpy, bmesh, json, math, os, sys

ROOT = "D:/Projects/arttrolley"

# ------------------------------------------------------------------ config
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cfg_rel = argv[0] if argv else "config/kurti_01.json"
with open(f"{ROOT}/blender/{cfg_rel}") as f:
    CFG = json.load(f)

B, W, N = CFG["body"], CFG["widths"], CFG["neckline"]
SL, SLIT, DR = CFG["sleeves"], CFG["side_slit"], CFG["drape"]
MAT, EXP = CFG["material"], CFG["export"]

SEG_R, SEG_V = B["radial_segments"], B["vertical_segments"]
SHOULDER_Z, HEM_Z = B["shoulder_height"], B["hem_height"]
LENGTH = SHOULDER_Z - HEM_Z


# --------------------------------------------------------------- helpers --
def lerp(a, b, t):
    return a + (b - a) * t


def width_at(t):
    """Garment half-width at normalised height t (0 = hem, 1 = shoulder).
    Piecewise-linear through the four measured points so the silhouette is
    fully controlled by config rather than hard-coded curves."""
    pts = [
        (0.0, W["hem"]),
        (W["hip_at"], W["hip"]),
        (W["waist_at"], W["waist"]),
        (W["chest_at"], W["chest"]),
        (1.0, W["shoulder"]),
    ]
    for i in range(len(pts) - 1):
        t0, w0 = pts[i]
        t1, w1 = pts[i + 1]
        if t0 <= t <= t1:
            f = (t - t0) / (t1 - t0) if t1 > t0 else 0
            f = f * f * (3 - 2 * f)  # smoothstep: no hard creases at the seams
            return lerp(w0, w1, f)
    return W["shoulder"]


def create_folds(theta, t):
    """Three superimposed fold scales. Amplitude grows toward the hem —
    fabric hangs looser the further it falls from the shoulder."""
    fall = (1.0 - t) ** DR["gravity_bias"]
    macro = math.sin(theta * DR["macro_freq"] + t * 2.1) * DR["macro_amp"]
    pleat = math.sin(theta * DR["pleat_freq"] - t * 1.4) * DR["pleat_amp"]
    micro = math.sin(theta * DR["micro_freq"] + t * 5.0) * DR["micro_amp"]
    return (macro + pleat + micro) * fall


def in_armhole(theta):
    """True inside either side armhole sector (centred on +X and -X)."""
    half = math.radians(SL["armhole_half_angle"])
    d0 = abs(math.atan2(math.sin(theta), math.cos(theta)))
    d180 = abs(math.atan2(math.sin(theta - math.pi), math.cos(theta - math.pi)))
    return d0 < half or d180 < half


def in_slit(theta):
    """True inside either side-seam slit sector."""
    if not SLIT["enabled"]:
        return False
    half = math.radians(SLIT["half_angle"])
    d0 = abs(math.atan2(math.sin(theta), math.cos(theta)))
    d180 = abs(math.atan2(math.sin(theta - math.pi), math.cos(theta - math.pi)))
    return d0 < half or d180 < half


# ------------------------------------------------------------ kurti body --
def create_kurti_body():
    mesh = bpy.data.meshes.new("KurtiBody")
    obj = bpy.data.objects.new("KurtiBody", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    rings = []
    for vi in range(SEG_V + 1):
        t = vi / SEG_V  # 0 = hem, 1 = shoulder
        z = HEM_Z + t * LENGTH
        base_w = width_at(t)
        row = []
        for ri in range(SEG_R):
            theta = (ri / SEG_R) * math.pi * 2
            r = base_w + create_folds(theta, t)
            row.append(bm.verts.new((math.cos(theta) * r,
                                     math.sin(theta) * r * B["depth_ratio"],
                                     z)))
        rings.append(row)
    bm.verts.ensure_lookup_table()

    slit_t = SLIT["start_height"]
    for vi in range(SEG_V):
        t_mid = (vi + 0.5) / SEG_V
        for ri in range(SEG_R):
            theta = ((ri + 0.5) / SEG_R) * math.pi * 2
            # Real side slits: below slit height the side-seam faces are
            # simply not created, leaving an actual opening in the mesh.
            if t_mid < slit_t and in_slit(theta):
                continue
            a = rings[vi][ri]
            b = rings[vi][(ri + 1) % SEG_R]
            c = rings[vi + 1][(ri + 1) % SEG_R]
            d = rings[vi + 1][ri]
            bm.faces.new((a, b, c, d))

    # shoulder yoke: outer shoulder ring -> neck ring, skipping armholes
    neck_ring = []
    neck_z = SHOULDER_Z - N["depth"]
    for ri in range(SEG_R):
        theta = (ri / SEG_R) * math.pi * 2
        nr = N["radius"]
        neck_ring.append(bm.verts.new((math.cos(theta) * nr,
                                       math.sin(theta) * nr * 0.92,
                                       SHOULDER_Z if not in_armhole(theta) else SHOULDER_Z)))
    bm.verts.ensure_lookup_table()
    for ri in range(SEG_R):
        theta = ((ri + 0.5) / SEG_R) * math.pi * 2
        if in_armhole(theta):
            continue  # left open for the sleeve to attach into
        a = rings[SEG_V][ri]
        b = rings[SEG_V][(ri + 1) % SEG_R]
        c = neck_ring[(ri + 1) % SEG_R]
        d = neck_ring[ri]
        bm.faces.new((a, b, c, d))

    bm.normal_update()
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        for loop in f.loops:
            v = loop.vert
            u = (math.atan2(v.co.y, v.co.x) / (2 * math.pi)) + 0.5
            vv = (v.co.z - HEM_Z) / LENGTH
            loop[uv].uv = (u * MAT["uv_scale"][0], vv * MAT["uv_scale"][1])
    bm.to_mesh(mesh)
    bm.free()
    return obj, neck_z


# ---------------------------------------------------------------- collar --
def create_neckline(neck_z):
    """Mandarin band collar — a short standing ring at the neck opening."""
    if N["type"] != "mandarin":
        return None
    mesh = bpy.data.meshes.new("Collar")
    obj = bpy.data.objects.new("Collar", mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    rows = []
    STEPS = 6
    for i in range(STEPS + 1):
        t = i / STEPS
        z = SHOULDER_Z + t * N["collar_height"]
        r = N["radius"] * lerp(1.0, N["collar_flare"], t)
        row = []
        for ri in range(SEG_R):
            theta = (ri / SEG_R) * math.pi * 2
            row.append(bm.verts.new((math.cos(theta) * r,
                                     math.sin(theta) * r * 0.92, z)))
        rows.append(row)
    bm.verts.ensure_lookup_table()
    for i in range(STEPS):
        for ri in range(SEG_R):
            a = rows[i][ri]
            b = rows[i][(ri + 1) % SEG_R]
            c = rows[i + 1][(ri + 1) % SEG_R]
            d = rows[i + 1][ri]
            bm.faces.new((a, b, c, d))
    bm.normal_update()
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        for loop in f.loops:
            v = loop.vert
            u = (math.atan2(v.co.y, v.co.x) / (2 * math.pi)) + 0.5
            loop[uv].uv = (u * 2, (v.co.z - SHOULDER_Z) / max(N["collar_height"], 1e-6))
    bm.to_mesh(mesh)
    bm.free()
    return obj


# --------------------------------------------------------------- sleeves --
def create_sleeves():
    """Tapered tubes growing out of each armhole, angled outward and down."""
    # Derive the sleeve's UV scale from the body's, in proportion to their
    # relative dimensions. A fixed scale made the motifs far denser on the
    # sleeve than the body, because the sleeve's circumference is roughly a
    # third of the torso's — the print must stay the same physical size
    # across every panel, and this keeps holding true if the config changes.
    body_circ = 2 * math.pi * W["shoulder"]
    sleeve_circ = 2 * math.pi * ((SL["upper_radius"] + SL["cuff_radius"]) / 2)
    sleeve_u_scale = MAT["uv_scale"][0] * (sleeve_circ / body_circ)
    sleeve_v_scale = MAT["uv_scale"][1] * (SL["length"] / LENGTH)

    objs = []
    for side in (1, -1):
        mesh = bpy.data.meshes.new(f"Sleeve_{'R' if side > 0 else 'L'}")
        obj = bpy.data.objects.new(mesh.name, mesh)
        bpy.context.collection.objects.link(obj)
        bm = bmesh.new()

        start_x = side * (W["shoulder"] * 0.86)
        # Start level with the shoulder, not below it. Starting lower left a
        # visible notch between sleeve top and body, so the sleeves read as
        # detached tubes floating beside the garment.
        start_z = SHOULDER_Z
        rows = []
        for i in range(SL["segments"] + 1):
            t = i / SL["segments"]
            # Arms HANG. The sleeve drops almost straight down, easing only
            # slightly outward near the shoulder. The previous version moved
            # outward as far as it moved down, which produced flat wings
            # sticking out sideways instead of a sleeve.
            x = start_x + side * SL["outward"] * math.sin(t * math.pi * 0.5)
            z = start_z - t * SL["length"]
            r = lerp(SL["upper_radius"], SL["cuff_radius"], t)
            row = []
            for ri in range(SL["radial_segments"]):
                theta = (ri / SL["radial_segments"]) * math.pi * 2
                fold = math.sin(theta * 7 + t * 3) * 0.0022 * (0.4 + t)
                rr = r + fold
                # horizontal (XY) cross-section swept down Z — a real tube
                row.append(bm.verts.new((x + math.cos(theta) * rr,
                                         math.sin(theta) * rr * 0.86,
                                         z)))
            rows.append(row)
        bm.verts.ensure_lookup_table()
        for i in range(SL["segments"]):
            for ri in range(SL["radial_segments"]):
                a = rows[i][ri]
                b = rows[i][(ri + 1) % SL["radial_segments"]]
                c = rows[i + 1][(ri + 1) % SL["radial_segments"]]
                d = rows[i + 1][ri]
                bm.faces.new((a, b, c, d))
        bm.normal_update()
        uv = bm.loops.layers.uv.new()
        for f in bm.faces:
            for loop in f.loops:
                v = loop.vert
                u = (math.atan2(v.co.y, v.co.x - start_x) / (2 * math.pi)) + 0.5
                loop[uv].uv = (u * sleeve_u_scale, (start_z - v.co.z) / max(SL["length"], 1e-6) * sleeve_v_scale)
        bm.to_mesh(mesh)
        bm.free()
        objs.append(obj)
    return objs


# -------------------------------------------------------------- material --
def create_fabric_material(name):
    preset = MAT["presets"][MAT["fabric"]]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = preset["roughness"]
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = preset["sheen"]
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = preset["specular"]
    bsdf.inputs["Base Color"].default_value = MAT["base_tint"]

    tex_path = f"{ROOT}/{MAT['print_texture']}"
    if os.path.exists(tex_path):
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(tex_path)
        # Must be sRGB. Feeding this same node into a Bump/Normal input
        # makes Blender reclassify the image as Non-Color, after which the
        # print is read as raw linear data and a red-on-black pattern
        # renders as flat grey. Colour and relief therefore stay on
        # completely separate paths.
        tex.image.colorspace_settings.name = 'sRGB'
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])

    # Woven micro-relief from procedural noise, never from the print: a
    # printed motif is flat on real cloth, it is not embossed.
    weave = nt.nodes.new("ShaderNodeTexNoise")
    weave.inputs["Scale"].default_value = 320.0
    weave.inputs["Detail"].default_value = 2.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    nt.links.new(weave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


# ---------------------------------------------------------------- build ---
bpy.ops.wm.read_factory_settings(use_empty=True)

body, neck_z = create_kurti_body()
collar = create_neckline(neck_z)
sleeves = create_sleeves()

parts = [body] + ([collar] if collar else []) + sleeves
fabric = create_fabric_material("KurtiFabric")

for obj in parts:
    obj.data.materials.append(fabric)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    # fabric thickness — an infinitely thin shell reads as paper, and the
    # side slits would show a hollow interior without it
    solid = obj.modifiers.new("Solidify", 'SOLIDIFY')
    solid.thickness = CFG["fabric_thickness"]
    solid.offset = 0.0
    bpy.ops.object.modifier_apply(modifier="Solidify")

print("BUILT PARTS:", [(o.name, len(o.data.vertices)) for o in parts])

# --------------------------------------------------------------- export ---
os.makedirs(f"{ROOT}/{EXP['dir']}", exist_ok=True)


def export_level(label, ratio):
    bpy.ops.object.select_all(action='DESELECT')
    exported = []
    for obj in parts:
        dup = obj.copy()
        dup.data = obj.data.copy()
        dup.name = f"{obj.name}_{label}"
        bpy.context.collection.objects.link(dup)
        bpy.context.view_layer.objects.active = dup
        if ratio < 0.999:
            dec = dup.modifiers.new("Decimate", 'DECIMATE')
            dec.ratio = ratio
            bpy.ops.object.modifier_apply(modifier="Decimate")
        dup.select_set(True)
        exported.append(dup)
    suffix = "" if label == "normal" else f"_{label}"
    path = f"{ROOT}/{EXP['dir']}/{EXP['basename']}{suffix}.glb"
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True,
                              export_apply=True, export_materials='EXPORT')
    tris = sum(len(o.data.polygons) for o in exported)
    print(f"EXPORTED {label}: {path} faces={tris}")
    for o in exported:
        bpy.data.objects.remove(o, do_unlink=True)


for label, ratio in EXP["levels"].items():
    export_level(label, ratio)

print("DONE")
