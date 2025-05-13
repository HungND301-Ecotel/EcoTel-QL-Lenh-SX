import 'package:flutter/material.dart';

class TaskAssignmentMaterialSelect extends StatefulWidget {
  const TaskAssignmentMaterialSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentMaterialSelect();
}

class _TaskAssignmentMaterialSelect
    extends State<TaskAssignmentMaterialSelect> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'Bùn chặn'},
    {'name': 'Bùn chặn CN'},
    {'name': 'Bùn trộn'},
    {'name': 'Bùn trộn CN'},
    {'name': 'Bùn đặc CN'},
    {'name': 'Đất trộn'},
    {'name': 'Bùn chặn'},
    {'name': 'Bùn chặn CN'},
    {'name': 'Bùn trộn'},
    {'name': 'Bùn trộn CN'},
    {'name': 'Bùn đặc CN'},
    {'name': 'Đất trộn'},
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
                                Icons.group_work_outlined,
                                color: Colors.blue,
                              ),
                              title: Text(item['name']),
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
