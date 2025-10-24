import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/location_hive.dart';
import 'package:soft/local/location_hive_extension.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/location_item.dart';
import 'package:soft/services/location_service.dart';
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
  List<LocationHive> locations = [];
  final LocationService _locationService =
      LocationService();
  final LocalSyncService _localSyncService =
      LocalSyncService();
  void getAllLocation() async {
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
      final order = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      ).order;
      if (order?.location != null &&
          order!.location!.isNotEmpty) {
        final selectedIds =
            order.location!.map((m) => m.id).toList();
        _selectedLocation = order.location!.last.toHive();
        setState(() {
          _onSelectLocation(order.location!.last.toHive());
          locations.sort((a, b) {
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
    getAllLocation();
    // WidgetsBinding.instance.addPostFrameCallback((_) {
    //   final order =
    //       Provider.of<ReportDraftProvider>(
    //         context,
    //         listen: false,
    //       ).order;
    //   if (order?.location != null) {
    //     _selectedLocation = order!.location!.first.id;
    //     setState(() {
    //       _onSelectLocation(order.location!.first.id);
    //     });
    //   }
    // });
  }

  LocationHive? _selectedLocation;
  void _onSelectLocation(LocationHive selectedLocation) {
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
                              selected: _selectedLocation?.id ==
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
                    onPressed: _selectedLocation == null
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
