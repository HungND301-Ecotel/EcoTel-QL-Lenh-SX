import 'package:flutter/material.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/material_item.dart';
import 'package:soft/services/material_service.dart';
import 'package:provider/provider.dart';
import 'package:soft/services/report_service.dart';

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
      final order =
          Provider.of<ReportDraftProvider>(
            context,
            listen: false,
          ).order;
      if (order?.material != null &&
          order!.material!.isNotEmpty) {
        final selectedIds =
            order.material!.map((m) => m.id).toList();
        _selectedMaterial = selectedIds.last;
        setState(() {
          _onSelectedMaterial(order.material!.last.id);
          materials.sort((a, b) {
            if (selectedIds.contains(a.id) &&
                !selectedIds.contains(b.id)) {
              return -1;
            } else if (!selectedIds.contains(a.id) &&
                selectedIds.contains(b.id)) {
              return 1;
            }
            return 0;
          });
        });
      }
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

  final ReportService _reportService = ReportService();
  void create() async {
    final provider = Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    );

    provider.setMaterial(_selectedMaterial!);
    var result = await _reportService.createReport({
      "orderId": provider.orderId,
      "material": provider.material,
      "device": provider.device,
      "excavator": provider.excavator,
      "toLocation": provider.toLocation,
      "quantity": 0,
    });
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      provider.reset();
      Navigator.pushNamed(
        context,
        WorkLogRoutes.vehicleTripList,
        arguments: provider.orderId,
      );
    }
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
                              showDialog(
                                context: context,
                                builder:
                                    (
                                      BuildContext
                                      dialogContext,
                                    ) => AlertDialog(
                                      title: Text(
                                        "Xác nhận",
                                      ),
                                      content: Text(
                                        "Bạn muốn lưu chuyến vào hệ thống",
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () {
                                            Navigator.of(
                                              dialogContext,
                                            ).pop();
                                          },
                                          style: TextButton.styleFrom(
                                            foregroundColor:
                                                Colors.blue,
                                          ),
                                          child: Text(
                                            "Bỏ qua",
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            Navigator.of(
                                              dialogContext,
                                            ).pop();
                                            create();
                                          },
                                          style: TextButton.styleFrom(
                                            foregroundColor:
                                                Colors.blue,
                                          ),
                                          child: Text(
                                            "Lưu lại",
                                          ),
                                        ),
                                      ],
                                    ),
                              );
                            },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Ghi lại'),
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
