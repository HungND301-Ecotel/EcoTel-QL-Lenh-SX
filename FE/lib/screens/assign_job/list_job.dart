import 'package:flutter/material.dart';
import 'package:job_manager/routes/assign_job_route.dart';

class ListJob extends StatefulWidget {
  const ListJob({super.key});

  @override
  State<StatefulWidget> createState() => _ListJob();
}

class _ListJob extends State<ListJob> {
  final List<String> _allData = [
    'Bảo dưỡng, sửa chữa xe',
    'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
    'Bổ túc lái máy',
    'Bổ túc lái xe',
    'Công nhân',
    'Công nhân gác',
    'Công nhân sửa chữa điện',
    'Công nhân thủ kho',
    'Công nhân tạp vụ',
    'Cấp nước',
    'Gia công ống thủy lực',
    'Gác',
    'Gác, trực bơm nước',
  ];
  String _searchText = '';
  @override
  Widget build(BuildContext context) {
    List<String> _filteredItems =
        _allData
            .where(
              (item) => item.toLowerCase().contains(
                _searchText.toLowerCase(),
              ),
            )
            .toList();
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Loại công việc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white),
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
                _filteredItems.isEmpty
                    ? Center(child: Text('Không tìm thấy'))
                    : ListView.builder(
                      itemCount: _filteredItems.length,
                      itemBuilder: (context, index) {
                        final item = _filteredItems[index];
                        return Container(
                          decoration: BoxDecoration(
                            border: Border(
                              top: BorderSide(
                                color: Colors.grey.shade300,
                              ), // Viền trên
                              bottom: BorderSide(
                                color: Colors.grey.shade300,
                              ), // Viền dưới
                            ),
                          ),
                          child: ListTile(
                            leading: Icon(
                              Icons.build_circle_outlined,
                              color: Colors.grey,
                            ),
                            title: Text(item),
                            onTap: () {
                              Navigator.pushNamed(
                                context,
                                AssignJobRoutes.add_assign,
                                arguments: item,
                              );
                            },
                          ),
                        );
                      },
                    ),
          ),
        ],
      ),
    );
  }
}
