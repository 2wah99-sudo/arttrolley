import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.frame_start, s.frame_end = 1, 60
bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=0.5, location=(0,0,0))
vat = bpy.context.object
m = bpy.data.materials.new("Indigo")
m.diffuse_color = (0.08,0.05,0.25,1)
vat.data.materials.append(m)
bpy.ops.object.light_add(type='SUN', location=(2,-2,3))
bpy.context.object.data.energy = 3
bpy.ops.object.camera_add(location=(0,-3,2.2), rotation=(math.radians(55),0,0))
s.camera = bpy.context.object
bpy.ops.export_scene.gltf(filepath="D:/Projects/arttrolley/public/generated/dye-vat.glb", export_animations=True)
print("DONE")
