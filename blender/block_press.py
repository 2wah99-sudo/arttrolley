import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.frame_start, s.frame_end = 1, 60

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0,0,1))
block = bpy.context.object
block.scale = (0.5,0.5,0.15)
mat = bpy.data.materials.new("Teak")
mat.diffuse_color = (0.2,0.13,0.1,1)
block.data.materials.append(mat)

bpy.ops.mesh.primitive_plane_add(size=4, location=(0,0,0))
cloth = bpy.context.object
cmat = bpy.data.materials.new("Cloth")
cmat.diffuse_color = (0.83,0.35,0.27,1)
cloth.data.materials.append(cmat)

block.location.z = 1
block.keyframe_insert("location", frame=1)
block.location.z = 0.15
block.keyframe_insert("location", frame=25)
block.location.z = 1
block.keyframe_insert("location", frame=45)

bpy.ops.object.light_add(type='SUN', location=(2,-2,3))
bpy.context.object.data.energy = 3
bpy.ops.object.camera_add(location=(2.2,-2.2,1.6), rotation=(math.radians(65),0,math.radians(45)))
s.camera = bpy.context.object

out = "D:/Projects/arttrolley/public/generated/block-press.glb"
bpy.ops.export_scene.gltf(filepath=out, export_animations=True)
print("DONE:", out)
s.render.engine = 'BLENDER_EEVEE'
s.render.filepath = "D:/Projects/arttrolley/public/generated/block-press-preview.png"
s.frame_set(25)
bpy.ops.render.render(write_still=True)
