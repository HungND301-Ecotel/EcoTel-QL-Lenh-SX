import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/location_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/location_item.dart';
import 'package:soft/services/location_service.dart';
import 'package:provider/provider.dart';

class ServiceVehicleSelectEndPoint extends StatefulWidget {
  const ServiceVehicleSelectEndPoint({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ServiceVehicleSelectEndPoint();
}

class _ServiceVehicleSelectEndPoint
    extends State<ServiceVehicleSelectEndPoint> {
  bool _isLoading = true;
  List<LocationHive> locations = [];
  final LocationService _locationService =
      LocationService();
  final LocalSyncService _localSyncService =
      LocalSyncService();
  void getAllMaterial() async {
    final box = Hive.box<LocationHive>("locations");
    final localMaterials = box.values.toList();
    setState(() {
      locations = localMaterials;
    });
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
      final List data = result['data'] ?? [];
      await _localSyncService.syncHive<LocationHive>(
          box: box,
          data: data,
          prefix: "LOCATION",
          fromJson: (item) => LocationHive.fromJson(item));

      // 🟢 4. Reload lại danh sách
      final updated = box.values.toList();
      setState(() {
        locations = updated;
        _isLoading = false;
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

  LocationHive? _selecteLocation;
  void _onSelectLocation(LocationHive selectedLocation) {
    setState(() {
      _selecteLocation = selectedLocation;
    });

    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setToLocation(selectedLocation);
  }

  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    List<LocationHive> filteredItems = locations
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
            child: _isLoading
                ? Center(
                    child: CircularProgressIndicator(),
                  )
                : SingleChildScrollView(
                    child: Column(
                      children: filteredItems
                          .map(
                            (item) => LocationItem(
                              data: item,
                              selected:
                                  _selecteLocation?.id ==
                                      item.id,
                              onTap: () {
                                _onSelectLocation(
                                  item,
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
                      Navigator.pop(
                        context,
                      ); // sửa lại để thực sự "về trước"
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Về trước'),
                  ),
                ),
                const SizedBox(
                  width: 8,
                ), // khoảng cách giữa 2 nút
                Expanded(
                  child: ElevatedButton(
                    onPressed: _selecteLocation == null
                        ? null
                        : () {
                            Navigator.pushNamed(
                              context,
                              WorkLogRoutes
                                  .serviceVehicleSelectMaterial,
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
