import 'package:flutter/material.dart';

class TaskAssignmentVehicleSelect extends StatefulWidget {
  const TaskAssignmentVehicleSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentVehicleSelect();
}

class _TaskAssignmentVehicleSelect
    extends State<TaskAssignmentVehicleSelect> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
    {'name': 'CKCD1-CN'},
  ];
  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    List<Map<String, dynamic>> filteredItems =
        _allData
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
            child: SingleChildScrollView(
              child: Column(
                children:
                    filteredItems
                        .map(
                          (item) => Container(
                            decoration: BoxDecoration(
                              border: Border(
                                top: BorderSide(
                                  color:
                                      Colors.grey.shade300,
                                ), // Viền trên
                                bottom: BorderSide(
                                  color:
                                      Colors.grey.shade300,
                                ), // Viền dưới
                              ),
                            ),
                            child: ListTile(
                              leading: Icon(
                                Icons.navigation,
                                color: Colors.blue,
                              ),
                              title: Text(item['name']),
                              trailing: Icon(
                                Icons.arrow_forward_ios,
                                size: 16,
                                color: Colors.grey,
                              ),
                              onTap: () {},
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
