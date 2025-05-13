import 'package:flutter/material.dart';

class TaskAssignmentDumpSiteSelect extends StatefulWidget {
  const TaskAssignmentDumpSiteSelect({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentDumpSiteSelect();
}

class _TaskAssignmentDumpSiteSelect
    extends State<TaskAssignmentDumpSiteSelect> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'BV kt2'},
    {'name': '(KTCSI-1)-Điểm 01'},
    {'name': '(KTCSI-10)-Điểm 10'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
    {'name': 'BV kt2'},
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
                                Icons.park,
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
