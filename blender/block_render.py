import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.frame_start, s.frame_end = 1, 72
s.render.fps = 24
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 1280
s.render.resolution_y = 720
s.world = bpy.data.worlds.new("W")
s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0,0,0,1)

# teak block with wood-grain procedural material
bpy.ops.mesh.primitive_cube_add(size=1.4)
block = bpy.context.object
block.scale = (1,1,0.32)
mat = bpy.data.materials.new("Teak")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs['Scale'].default_value = 18
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.15,0.08,0.04,1)
ramp.color_ramp.elements[1].color = (0.32,0.19,0.10,1)
nt.links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.55
block.data.materials.append(mat)

# rim/key lights, red accent
bpy.ops.object.light_add(type='AREA', location=(2.2,-2,2.2))
k = bpy.context.object; k.data.energy = 300; k.data.color = (1,0.95,0.9)
bpy.ops.object.light_add(type='AREA', location=(-2,1.5,1))
r = bpy.context.object; r.data.energy = 180; r.data.color = (0.84,0.26,0.19)

bpy.ops.object.camera_add(location=(0,-2.6,0.9), rotation=(math.radians(75),0,0))
s.camera = bpy.context.object

for f in (1, 72):
    block.rotation_euler = (0,0, 0 if f==1 else math.radians(360))
    block.keyframe_insert("rotation_euler", frame=f)
s.render.image_settings.file_format='PNG'; s.render.filepath='D:/Projects/arttrolley/public/generated/br_/'
bpy.ops.render.render(animation=True)
print("DONE")
