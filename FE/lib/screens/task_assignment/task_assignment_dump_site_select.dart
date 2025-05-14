import 'package:flutter/material.dart';
import 'package:job_manager/services/location_service.dart';

class TaskAssignmentDumpSiteSelect extends StatefulWidget {
  const TaskAssignmentDumpSiteSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentDumpSiteSelect();
}

class _TaskAssignmentDumpSiteSelect
    extends State<TaskAssignmentDumpSiteSelect> {
  final List<Map<String, dynamic>> locations = [];
  bool _isLoading = true;

  final LocationService _locationService =
      LocationService();

  void getAllLocation() async {
    var result = await _locationService.getAllLocation();

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
        locations
            .clear(); // Nếu cần làm sạch danh sách trước
        locations.addAll(
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
    getAllLocation();
  }

  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    List<Map<String, dynamic>> filteredItems =
        locations
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
                                        Icons.park,
                                        color: Colors.blue,
                                      ),
                                      title: Text(
                                        item['name'],
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
