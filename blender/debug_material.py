"""Diagnostic: dump the material graph of an imported GLB and report the UV
range actually stored on the mesh. Used to distinguish 'texture missing'
from 'texture present but sampled wrongly'."""
import bpy, sys

ROOT = "D:/Projects/arttrolley"
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODEL = argv[0] if argv else "public/models/kurti.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=f"{ROOT}/{MODEL}")

for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    print(f"\n--- {obj.name} ---")
    uvl = obj.data.uv_layers.active
    if uvl:
        us = [d.uv[0] for d in uvl.data]
        vs = [d.uv[1] for d in uvl.data]
        print(f"  UV u range: {min(us):.3f} .. {max(us):.3f}")
        print(f"  UV v range: {min(vs):.3f} .. {max(vs):.3f}")
    else:
        print("  NO UV LAYER")
    for slot in obj.material_slots:
        m = slot.material
        if not m:
            continue
        print(f"  material: {m.name}")
        if not m.node_tree:
            print("    no node tree")
            continue
        for node in m.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                img = node.image
                print(f"    TEX_IMAGE: {img.name if img else None} size={tuple(img.size) if img else None} colorspace={img.colorspace_settings.name if img else None}")
                for out in node.outputs:
                    for link in out.links:
                        print(f"      -> {link.to_node.name}.{link.to_socket.name}")
            if node.type == 'BSDF_PRINCIPLED':
                bc = node.inputs["Base Color"]
                print(f"    BSDF BaseColor linked={bc.is_linked} default={tuple(round(x,3) for x in bc.default_value)}")
                if bc.is_linked:
                    print(f"      from: {bc.links[0].from_node.name}")
print("\nDEBUG DONE")
