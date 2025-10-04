import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/services/device_service.dart';

class TaskAssignmentAllDeviceSelect extends StatefulWidget {
  const TaskAssignmentAllDeviceSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentAllDeviceSelect();
}

class _TaskAssignmentAllDeviceSelect
    extends State<TaskAssignmentAllDeviceSelect> {
  final List<DeviceModel> devices = [];
  bool _isLoading = true;

  final DeviceService _deviceService = DeviceService();

  void getAllTask() async {
    var result = await _deviceService.getDevicesAll();

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
    }
    setState(() {
      _isLoading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    getAllTask();
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
          'Tất cả',
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
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      labelText: 'Tìm kiếm',
                      prefixIcon: Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.grey[200],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          32,
                        ),
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
              ],
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
                                  (item) => Container(
                                    decoration: BoxDecoration(
                                      border: Border(
                                        top: BorderSide(
                                          color:
                                              Colors
                                                  .grey
                                                  .shade300,
                                        ), // Viền trên
                                        bottom: BorderSide(
                                          color:
                                              Colors
                                                  .grey
                                                  .shade300,
                                        ), // Viền dưới
                                      ),
                                    ),
                                    child: ListTile(
                                      leading: Icon(
                                        Icons.navigation,
                                        color: Colors.blue,
                                      ),
                                      title: Text(
                                        item.code,
                                      ),
                                      trailing: Icon(
                                        Icons
                                            .power_settings_new,
                                        size: 30,
                                        color:
                                            item.status ==
                                                    'active'
                                                ? Colors
                                                    .green
                                                : Colors
                                                    .red,
                                      ),
                                      onTap: () {
                                        Navigator.pop(
                                          context,
                                          item,
                                        );
                                      },
                                    ),
                                  ),
                                )
                                .toList(),
                      ),
                    ),
          ),
        ],
      ),
    );
  }
}
