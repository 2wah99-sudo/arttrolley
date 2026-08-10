"""Render front / side / back views of the exported kurti GLB into one sheet
so the result can be visually judged, not assumed from export logs."""
import bpy, math, sys

ROOT = "D:/Projects/arttrolley"
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODEL = argv[0] if argv else "public/models/kurti.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 620
s.render.resolution_y = 900
s.world = bpy.data.worlds.new("W")
s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0.87, 0.81, 0.71, 1)
# Ambient kept low: at strength 1.0 the cream environment flooded the model
# and a red-on-black print rendered as pale grey, which looked exactly like
# "texture failed to apply" when the GLB was in fact correct.
s.world.node_tree.nodes["Background"].inputs[1].default_value = 0.25

bpy.ops.import_scene.gltf(filepath=f"{ROOT}/{MODEL}")
meshes = [o for o in s.objects if o.type == 'MESH']
print("IMPORTED:", [(o.name, len(o.data.vertices)) for o in meshes])

root = bpy.data.objects.new("Root", None)
s.collection.objects.link(root)
for o in meshes:
    if o.parent is None:
        o.parent = root

def light(name, kind, loc, energy, size=2.4):
    d = bpy.data.lights.new(name, kind)
    d.energy = energy
    if kind == 'AREA':
        d.size = size
    o = bpy.data.objects.new(name, d)
    s.collection.objects.link(o)
    o.location = loc
    return o

# Energies kept low deliberately: at 420/150/260 the render blew out
# completely — a red-on-black print washed to pale grey and read as "no
# texture applied" when the texture was in fact fine.
light("key", 'AREA', (2.0, -2.4, 2.2), 95)
light("fill", 'AREA', (-2.2, -1.6, 1.4), 38)
light("rim", 'AREA', (0, 2.8, 1.9), 55)

cam_d = bpy.data.cameras.new("c")
cam_d.lens = 62
cam = bpy.data.objects.new("c", cam_d)
s.collection.objects.link(cam)
s.camera = cam
cam.location = (0, -3.0, 1.02)
cam.rotation_euler = (math.radians(89), 0, 0)

s.render.image_settings.file_format = 'PNG'
for label, yaw in (("front", 0), ("side", 90), ("back", 180)):
    root.rotation_euler = (0, 0, math.radians(yaw))
    s.render.filepath = f"{ROOT}/public/generated/kurti_{label}.png"
    bpy.ops.render.render(write_still=True)
    print("RENDERED", label)
print("PREVIEW DONE")
