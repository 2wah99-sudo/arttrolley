import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.frame_start, s.frame_end = 1, 90
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 800; s.render.resolution_y = 800
s.world = bpy.data.worlds.new("W"); s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0,0,0,1)

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1)
gem = bpy.context.object
bpy.ops.object.modifier_add(type='BEVEL')
gem.modifiers["Bevel"].width = 0.02
gem.modifiers["Bevel"].segments = 1

mat = bpy.data.materials.new("Red"); mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs['Base Color'].default_value = (0.84,0.26,0.19,1)
bsdf.inputs['Metallic'].default_value = 0.3
bsdf.inputs['Roughness'].default_value = 0.15
gem.data.materials.append(mat)

key = bpy.data.lights.new("k",'AREA'); ko=bpy.data.objects.new("k",key)
s.collection.objects.link(ko); ko.location=(2,-2,2.5); key.energy=500
fill = bpy.data.lights.new("f",'AREA'); fo=bpy.data.objects.new("f",fill)
s.collection.objects.link(fo); fo.location=(-2,1.5,1); fill.energy=200; fill.color=(1,0.9,0.85)

cam = bpy.data.cameras.new("c"); co=bpy.data.objects.new("c",cam)
s.collection.objects.link(co); co.location=(0,-4,0); co.rotation_euler=(math.radians(90),0,0)
s.camera = co

gem.rotation_euler = (0,0,0); gem.keyframe_insert("rotation_euler", frame=1)
gem.rotation_euler = (math.radians(360),math.radians(360),0); gem.keyframe_insert("rotation_euler", frame=90)

s.render.image_settings.file_format = 'PNG'
s.render.filepath = "D:/Projects/arttrolley/public/generated/gem_/"
bpy.ops.render.render(animation=True)
print("DONE")
