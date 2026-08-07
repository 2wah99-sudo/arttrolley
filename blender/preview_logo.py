import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 800; s.render.resolution_y = 800
s.world = bpy.data.worlds.new("W"); s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0,0,0,1)
bpy.ops.import_scene.gltf(filepath="D:/Projects/arttrolley/public/models/brand-logo.glb")
for o in bpy.context.selected_objects:
    print("PART:", o.name, o.dimensions)
key = bpy.data.lights.new("k",'AREA'); ko=bpy.data.objects.new("k",key)
s.collection.objects.link(ko); ko.location=(2,-2,2.5); key.energy=800
fill = bpy.data.lights.new("f",'AREA'); fo=bpy.data.objects.new("f",fill)
s.collection.objects.link(fo); fo.location=(-2,1.5,2); fill.energy=300
cam = bpy.data.cameras.new("c"); co=bpy.data.objects.new("c",cam)
s.collection.objects.link(co); co.location=(0,-3.5,1); co.rotation_euler=(math.radians(80),0,0)
s.camera = co
s.render.image_settings.file_format='PNG'
s.render.filepath="D:/Projects/arttrolley/public/generated/logo_preview.png"
bpy.ops.render.render(write_still=True)
print("DONE")
