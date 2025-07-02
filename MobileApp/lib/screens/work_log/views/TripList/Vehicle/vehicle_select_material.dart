import 'package:flutter/material.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/material_item.dart';
import 'package:soft/services/material_service.dart';
import 'package:provider/provider.dart';

class VehicleSelectMaterial extends StatefulWidget {
  const VehicleSelectMaterial({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectMaterial();
}

class _VehicleSelectMaterial
    extends State<VehicleSelectMaterial> {
  bool _isLoading = true;

  final List<MaterialModel> materials = [];
  final MaterialService _materialService =
      MaterialService();
  void getAllMaterial() async {
    var result = await _materialService.getAllMaterial();

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
        materials
            .clear(); // Nếu cần làm sạch danh sách trước
        materials.addAll(
          (data as List)
              .map((e) => MaterialModel.fromJson(e))
              .toList(),
        );
      });
    }
    setState(() {
      _isLoading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    getAllMaterial();
  }

  String? _selectedMaterial;
  void _onSelectedMaterial(String selectedMaterial) {
    setState(() {
      _selectedMaterial = selectedMaterial;
    });
    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setMaterial(selectedMaterial);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Vật liệu',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child:
                _isLoading
                    ? Center(
                      child: CircularProgressIndicator(),
                    )
                    : SingleChildScrollView(
                      child: Column(
                        children:
                            materials
                                .map(
                                  (item) => MaterialItem(
                                    data: item,
                                    selected:
                                        _selectedMaterial ==
                                        item.id,
                                    onTap: () {
                                      _onSelectedMaterial(
                                        item.id,
                                      );
                                    },
                                  ),
                                )
                                .toList(),
                      ),
                    ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Về trước'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed:
                        _selectedMaterial == null
                            ? null
                            : () {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .vehicleTripCount,
                              );
                            },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Tiếp tục'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
