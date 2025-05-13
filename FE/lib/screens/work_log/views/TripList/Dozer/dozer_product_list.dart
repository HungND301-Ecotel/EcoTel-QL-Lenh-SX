import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/performance_item.dart';

class DozerProductList extends StatefulWidget {
  const DozerProductList({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DozerProductList();
}

class _DozerProductList extends State<DozerProductList> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'KT1-P12', 'perfomance': '180 phút'},
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Báo sản lượng',
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
            onPressed: () {
              Navigator.pushNamed(
                context,
                WorkLogRoutes.dozerSelectProduct,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children:
              _allData
                  .map(
                    (item) => PerformanceItem(data: item),
                  )
                  .toList(),
        ),
      ),
    );
  }
}
