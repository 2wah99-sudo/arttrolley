import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 1280; s.render.resolution_y = 720
s.eevee.taa_render_samples = 64
s.world = bpy.data.worlds.new("W")
s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0,0,0,1)

bpy.ops.mesh.primitive_cube_add(size=1.4)
block = bpy.context.object
block.scale = (1,1,0.32)
bpy.ops.object.shade_smooth()
mod = block.modifiers.new("sub", 'SUBSURF'); mod.levels = 1; mod.render_levels = 2
disp = block.modifiers.new("disp", 'DISPLACE')
tex = bpy.data.textures.new("carve", 'VORONOI')
tex.noise_scale = 0.18
disp.texture = tex; disp.strength = 0.015; disp.mid_level = 0.6

mat = bpy.data.materials.new("Teak"); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]
noise = nt.nodes.new("ShaderNodeTexNoise"); noise.inputs['Scale'].default_value = 22
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.13,0.07,0.035,1)
ramp.color_ramp.elements[1].color = (0.30,0.18,0.09,1)
nt.links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.5
block.data.materials.append(mat)

# ink pool beneath, red
bpy.ops.mesh.primitive_plane_add(size=2.2, location=(0,0,-0.17))
ink = bpy.context.object
im = bpy.data.materials.new("Ink"); im.use_nodes = True
im.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.6,0.05,0.05,1)
im.node_tree.nodes["Principled BSDF"].inputs['Roughness'].default_value = 0.1
ink.data.materials.append(im)

key = bpy.data.lights.new("key",'AREA'); ko=bpy.data.objects.new("key",key)
s.collection.objects.link(ko); ko.location=(2.2,-2,2.4); key.energy=400; key.size=1.5
fill = bpy.data.lights.new("fill",'AREA'); fo=bpy.data.objects.new("fill",fill)
s.collection.objects.link(fo); fo.location=(-2.4,1,1.2); fill.energy=120; fill.color=(0.85,0.3,0.22)
rim = bpy.data.lights.new("rim",'SPOT'); ro=bpy.data.objects.new("rim",rim)
s.collection.objects.link(ro); ro.location=(0,3,2); ro.rotation_euler=(math.radians(-60),0,0); rim.energy=250

cam = bpy.data.cameras.new("cam"); cam.dof.use_dof=True; cam.dof.aperture_fstop=1.8
co = bpy.data.objects.new("cam",cam); s.collection.objects.link(co)
co.location=(0,-2.3,0.85); co.rotation_euler=(math.radians(72),0,0)
cam.dof.focus_distance = 2.3
s.camera = co

s.render.filepath = "D:/Projects/arttrolley/public/generated/block-v2-preview.png"
s.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(write_still=True)
print("DONE")
