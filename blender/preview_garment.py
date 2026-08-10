"""Render a turnaround preview of the exported saree GLB so the result can
be visually inspected rather than trusted from export logs alone."""
import bpy, math

ROOT = "D:/Projects/arttrolley"
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 900
s.render.resolution_y = 1100
s.world = bpy.data.worlds.new("W")
s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0.86, 0.79, 0.69, 1)
s.world.node_tree.nodes["Background"].inputs[1].default_value = 1.1

bpy.ops.import_scene.gltf(filepath=f"{ROOT}/public/models/saree.glb")

# frame the imported garment
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
print("IMPORTED MESHES:", [(o.name, len(o.data.vertices)) for o in objs])
zs = [o.matrix_world.translation.z for o in objs]

key = bpy.data.lights.new("k", 'AREA'); ko = bpy.data.objects.new("k", key)
s.collection.objects.link(ko); ko.location = (2.2, -2.4, 2.4); key.energy = 420; key.size = 2.5
fill = bpy.data.lights.new("f", 'AREA'); fo = bpy.data.objects.new("f", fill)
s.collection.objects.link(fo); fo.location = (-2.2, -1.4, 1.4); fill.energy = 140; fill.size = 2.5
rim = bpy.data.lights.new("r", 'AREA'); ro = bpy.data.objects.new("r", rim)
s.collection.objects.link(ro); ro.location = (0, 2.6, 1.8); rim.energy = 200

cam_data = bpy.data.cameras.new("c"); cam = bpy.data.objects.new("c", cam_data)
s.collection.objects.link(cam); s.camera = cam
cam.location = (0, -3.4, 1.05)
cam.rotation_euler = (math.radians(88), 0, 0)

s.render.image_settings.file_format = 'PNG'
s.render.filepath = f"{ROOT}/public/generated/saree_preview.png"
bpy.ops.render.render(write_still=True)
print("PREVIEW DONE")
