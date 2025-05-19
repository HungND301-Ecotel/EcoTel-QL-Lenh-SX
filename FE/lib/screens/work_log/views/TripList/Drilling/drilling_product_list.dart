import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/performance_item.dart';

class DrillingProductList extends StatefulWidget {
  final String orderId;
  const DrillingProductList({super.key,required this.orderId});

  @override
  State<StatefulWidget> createState() =>
      _DrillingProductList();
}

class _DrillingProductList
    extends State<DrillingProductList> {
  final List<Map<String, dynamic>> _allData = [
    {
      'name': 'KT1-P12',
      'perfomance': '25 mks',
      "HardnessF": "12",
    },
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
                WorkLogRoutes.drillingSelectProduct,
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
