import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/device_item.dart';
import 'package:soft/services/device_service.dart';
import 'package:provider/provider.dart';

class DozerSelectVehicle extends StatefulWidget {
  const DozerSelectVehicle({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DozerSelectVehicle();
}

class _DozerSelectVehicle
    extends State<DozerSelectVehicle> {
  bool _isLoading = true;
  final List<DeviceModel> devices = [];
  final DeviceService _deviceService = DeviceService();

  void getAllDevice() async {
    var result = await _deviceService.getAlldevice();

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
        devices.clear(); // Nếu cần làm sạch danh sách trước
        devices.addAll(
          (data as List)
              .map((e) => DeviceModel.fromJson(e))
              .toList(),
        );
      });
      final order =
          Provider.of<ReportDraftProvider>(
            context,
            listen: false,
          ).order;
      if (order?.device != null &&
          order!.device!.isNotEmpty) {
        final selectedIds =
            order.device!.map((m) => m.id).toList();
        _selectedDevice = selectedIds.last;
        setState(() {
          _onSelectDevice(order.device!.last.id);
          devices.sort((a, b) {
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
    getAllDevice();
    // WidgetsBinding.instance.addPostFrameCallback((_) {
    //   final order =
    //       Provider.of<ReportDraftProvider>(
    //         context,
    //         listen: false,
    //       ).order;
    //   setState(() {
    //     devices.clear(); // Nếu cần làm sạch danh sách trước
    //     if (order?.device != null) {
    //       devices.addAll(
    //         order?.device as List<DeviceModel>,
    //       );
    //     }
    //     _isLoading = false;
    //   });
    // });
  }

  String? _selectedDevice;
  void _onSelectDevice(String selectedDevice) {
    setState(() {
      _selectedDevice = selectedDevice;
    });

    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setDevice(selectedDevice);
  }

  String _searchText = '';
  @override
  Widget build(BuildContext context) {
    List<DeviceModel> filteredItems =
        devices
            .where(
              (item) => item.code.toLowerCase().contains(
                _searchText.toLowerCase(),
              ),
            )
            .toList();
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Phương tiện',
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
                                  (item) => ExcavatorItem(
                                    data: item,
                                    selected:
                                        _selectedDevice ==
                                        item.id,
                                    onTap: () {
                                      _onSelectDevice(
                                        item.id,
                                      );
                                    },
                                  ),
                                )
                                .toList(),
                      ),
                    ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  _selectedDevice == null
                      ? null
                      : () {
                        Navigator.pushNamed(
                          context,
                          WorkLogRoutes.dozerSelectProduct,
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
    );
  }
}
