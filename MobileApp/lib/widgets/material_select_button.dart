import 'package:flutter/material.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/material_service.dart';

class MaterialSelectButton extends StatefulWidget {
  final String? material;
  final Function(String) onSelectMaterial;
  const MaterialSelectButton({
    super.key,
    this.material,
    required this.onSelectMaterial,
  });

  @override
  State<StatefulWidget> createState() =>
      _MaterialSelectButton();
}

class _MaterialSelectButton
    extends State<MaterialSelectButton> {
  MaterialModel? _material;

  final MaterialService _materialService =
      MaterialService();

  @override
  void initState() {
    super.initState();
    if (widget.material != null) {
      getmaterial();
    } // Gán giá trị phương tiện ban đầu
  }

  void getmaterial() async {
    var result = await _materialService.getById(
      widget.material!,
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      var data = result['data'];
      setState(() {
        _material = MaterialModel.fromJson(data);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        icon: Icon(Icons.pin),
        onPressed: () async {
          final selectedmaterial = await Navigator.of(
            context,
            rootNavigator: true,
          ).pushNamed(AppRoute.materialSelect);
          // Nếu có giá trị trả về, cập nhật phương tiện
          if (selectedmaterial != null &&
              selectedmaterial is MaterialModel) {
            widget.onSelectMaterial(selectedmaterial.id);
            setState(() {
              _material =
                  selectedmaterial; // Cập nhật giá trị phương tiện
            });
          }
        },
        style: TextButton.styleFrom(
          foregroundColor: Colors.black,
          backgroundColor: Colors.grey.shade300,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(0),
          ),
          alignment: Alignment.centerLeft,
        ),
        label: Text(_material?.name ?? 'Vật liệu'),
      ),
    );
  }
}
