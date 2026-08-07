import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath="D:/Projects/arttrolley/public/models/brand-logo-3d.obj")
obj = bpy.context.selected_objects[0]
mat = bpy.data.materials.new("Brand"); mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs['Base Color'].default_value = (0.84,0.26,0.19,1)
bsdf.inputs['Metallic'].default_value = 0.4
bsdf.inputs['Roughness'].default_value = 0.25
obj.data.materials.clear()
obj.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath="D:/Projects/arttrolley/public/models/brand-logo.glb", export_apply=True)
print("DONE", obj.dimensions)
