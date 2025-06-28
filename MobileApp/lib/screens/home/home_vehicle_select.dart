import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/services/device_service.dart';

class HomeVehicleSelect extends StatefulWidget {
  const HomeVehicleSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _HomeVehicleSelect();
}

class _HomeVehicleSelect extends State<HomeVehicleSelect> {
  final List<DeviceModel> devices = [];
  bool _isLoading = true;

  final DeviceService _deviceService = DeviceService();

  void getAllTask() async {
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
                                  (item) => GestureDetector(
                                    onTap: () {
                                      Navigator.pop(
                                        context,
                                        item,
                                      );
                                    },
                                    child: Container(
                                      width:
                                          double.infinity,
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
                                      child: Row(
                                        children: [
                                          Expanded(
                                            flex: 1,
                                            child: Column(
                                              children: [
                                                Icon(
                                                  Icons
                                                      .navigation,
                                                  color:
                                                      Colors
                                                          .blue,
                                                  size: 30,
                                                ),
                                              ],
                                            ),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment
                                                      .start,
                                              children: [
                                                Text(
                                                  item.code,
                                                  style: TextStyle(
                                                    fontWeight:
                                                        FontWeight.w800,
                                                    color:
                                                        Colors.deepPurpleAccent,
                                                    fontSize:
                                                        18,
                                                  ),
                                                ),
                                                SizedBox(
                                                  height: 8,
                                                ),
                                                Icon(
                                                  Icons
                                                      .cable_outlined,
                                                ),
                                                SizedBox(
                                                  height: 8,
                                                ),
                                                Icon(
                                                  Icons
                                                      .av_timer_outlined,
                                                ),
                                                SizedBox(
                                                  height: 8,
                                                ),
                                                Icon(
                                                  Icons
                                                      .power_settings_new_outlined,
                                                ),
                                              ],
                                            ),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment
                                                      .start,
                                              children: [
                                                Icon(
                                                  Icons
                                                      .my_location_outlined,
                                                ),
                                                SizedBox(
                                                  height: 8,
                                                ),
                                                Icon(
                                                  Icons
                                                      .phone,
                                                ),
                                                SizedBox(
                                                  height: 8,
                                                ),
                                                Icon(
                                                  Icons
                                                      .local_gas_station,
                                                ),
                                                SizedBox(
                                                  height: 8,
                                                ),
                                                Icon(
                                                  Icons
                                                      .thermostat,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
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
