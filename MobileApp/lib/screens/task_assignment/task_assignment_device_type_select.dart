import 'package:flutter/material.dart';
import 'package:soft/models/device_type_model.dart';
import 'package:soft/services/device_type_service.dart';

class TaskAssignmentDeviceTypeSelect
    extends StatefulWidget {
  const TaskAssignmentDeviceTypeSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentDeviceTypeSelect();
}

class _TaskAssignmentDeviceTypeSelect
    extends State<TaskAssignmentDeviceTypeSelect> {
  final List<DeviceTypeModel> deviceTypes = [];
  bool _isLoading = true;

  final DeviceTypeService _deviceTypeService =
      DeviceTypeService();

  void getAll() async {
    var result = await _deviceTypeService.getAll();

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
        deviceTypes
            .clear(); // Nếu cần làm sạch danh sách trước
        deviceTypes.addAll(
          (data as List)
              .map((e) => DeviceTypeModel.fromJson(e))
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
    getAll();
  }

  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    List<DeviceTypeModel> filteredItems =
        deviceTypes
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
          'Tất cả',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {},
            icon: Icon(Icons.filter_list_outlined),
          ),
        ],
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
                                        Icons
                                            .group_work_outlined,
                                        color: Colors.blue,
                                      ),
                                      title: Text(
                                        item.name,
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
