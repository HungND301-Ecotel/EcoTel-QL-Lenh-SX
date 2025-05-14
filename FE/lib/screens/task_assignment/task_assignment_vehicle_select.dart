import 'package:flutter/material.dart';
import 'package:job_manager/services/device_service.dart';

class TaskAssignmentVehicleSelect extends StatefulWidget {
  const TaskAssignmentVehicleSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentVehicleSelect();
}

class _TaskAssignmentVehicleSelect
    extends State<TaskAssignmentVehicleSelect> {
  final List<Map<String, dynamic>> devices = [];
  bool _isLoading = true;

  final DeviceService _deviceService = DeviceService();

  void getAllTask() async {
    var result = await _deviceService.getAlldevice();

    if (!mounted) return;
    if (result['status']=='error') {
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
          List<Map<String, dynamic>>.from(data),
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
    List<Map<String, dynamic>> filteredItems =
        devices
            .where(
              (item) => item['name'].toLowerCase().contains(
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
                SizedBox(width: 16),
                IconButton(
                  onPressed: () {},
                  icon: Icon(
                    Icons.build_circle_outlined,
                    color: Colors.blue,
                    size: 40,
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
                                        item['name'],
                                      ),
                                      trailing: Icon(
                                        Icons
                                            .arrow_forward_ios,
                                        size: 16,
                                        color: Colors.grey,
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
