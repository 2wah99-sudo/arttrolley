import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath="D:/Projects/arttrolley/public/models/brand-logo-3d.obj")

def mat(name, color, metallic=0.2, rough=0.3):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs['Base Color'].default_value = color
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    return m

CHARCOAL = (0.03,0.03,0.03,1)
RED = (0.84,0.26,0.19,1)
BLUSH = (0.95,0.77,0.73,1)

for o in bpy.data.objects:
    if o.type != 'MESH': continue
    o.data.materials.clear()
    n = o.name
    if n == 'Disc':
        o.data.materials.append(mat('m_disc', CHARCOAL, 0.1, 0.35))
    elif n == 'RimRing':
        o.data.materials.append(mat('m_rim', RED, 0.5, 0.2))
    elif n == 'PinkCurve':
        o.data.materials.append(mat('m_curve', BLUSH, 0.3, 0.25))
    elif n == 'RedDot':
        o.data.materials.append(mat('m_dot', RED, 0.6, 0.1))
    elif n.startswith('FanLine'):
        o.data.materials.append(mat('m_line', BLUSH, 0.4, 0.2))
    elif n.startswith('FanDot'):
        o.data.materials.append(mat('m_fandot', RED, 0.5, 0.15))

bpy.ops.export_scene.gltf(filepath="D:/Projects/arttrolley/public/models/brand-logo.glb", export_apply=True)
print("DONE")
