import 'package:flutter/material.dart';
import 'package:job_manager/models/location_model.dart';
import 'package:job_manager/providers/report_provider.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/location_item.dart';
import 'package:job_manager/services/location_service.dart';
import 'package:provider/provider.dart';

class VehicleSelectDestination extends StatefulWidget {
  const VehicleSelectDestination({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectDestination();
}

class _VehicleSelectDestination
    extends State<VehicleSelectDestination> {
  bool _isLoading = true;
  final List<LocationModel> locations = [];
  final LocationService _locationService =
      LocationService();
  void getAllMaterial() async {
    var result = await _locationService.getAllLocation();

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
        locations
            .clear(); // Nếu cần làm sạch danh sách trước
        locations.addAll(
          (data as List)
              .map((e) => LocationModel.fromJson(e))
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

  String? _selectedLocation;
  void _onSelectLocation(String selectedLocation) {
    setState(() {
      _selectedLocation = selectedLocation;
    });

    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setToLocation(selectedLocation);
  }

  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    List<LocationModel> filteredItems =
        locations
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
          'Đến điểm',
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
                                  (item) => LocationItem(
                                    data: item,
                                    selected:
                                        _selectedLocation ==
                                        item.id,
                                    onTap: () {
                                      _onSelectLocation(
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
                        _selectedLocation == null
                            ? null
                            : () {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .vehicleSelectMaterial,
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
