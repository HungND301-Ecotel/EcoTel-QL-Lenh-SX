import 'package:flutter/material.dart';
import 'package:job_manager/models/material_model.dart';
import 'package:job_manager/providers/report_provider.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/material_item.dart';
import 'package:job_manager/services/material_service.dart';
import 'package:provider/provider.dart';

class DozerSelectProduct extends StatefulWidget {
  const DozerSelectProduct({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DozerSelectProduct();
}

class _DozerSelectProduct
    extends State<DozerSelectProduct> {
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

  String? _selectedMaterialId;
  void _onSelectMaterial(String selectedMaterialId) {
    setState(() {
      _selectedMaterialId = selectedMaterialId;
    });

    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setMaterial(selectedMaterialId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Nhập loại hàng',
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
                                        _selectedMaterialId ==
                                        item.id,
                                    onTap: () {
                                      _onSelectMaterial(
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
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed:
                    _selectedMaterialId == null
                        ? null
                        : () {
                          Navigator.pushNamed(
                            context,
                            WorkLogRoutes
                                .dozerInputQuantity,
                          );
                        },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: Text('Tiếp tục'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
