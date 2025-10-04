import 'package:flutter/material.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/material_item.dart';
import 'package:soft/services/material_service.dart';
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

  String _searchText = '';
  @override
  Widget build(BuildContext context) {
    List<MaterialModel> filteredItems =
        materials
            .where(
              (item) => item.name.toLowerCase().contains(
                _searchText.toLowerCase(),
              ),
            )
            .toList();
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
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                labelText: 'Tìm kiếm',
                prefixIcon: Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey[200],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(32),
                  borderSide: BorderSide.none,
                ),
                contentPadding: EdgeInsets.symmetric(
                  vertical: 0,
                ),
                floatingLabelBehavior:
                    FloatingLabelBehavior.never,
              ),
              onChanged: (value) {
                setState(() {
                  _searchText = value;
                });
              },
            ),
          ),
          Divider(height: 1),
          Expanded(
            child:
                _isLoading
                    ? Center(
                      child: CircularProgressIndicator(),
                    )
                    : SingleChildScrollView(
                      child: Column(
                        children:
                            filteredItems
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
