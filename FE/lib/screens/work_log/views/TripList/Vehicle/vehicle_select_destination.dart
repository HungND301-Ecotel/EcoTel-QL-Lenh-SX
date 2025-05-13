import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/vehicle_destination_item.dart';

class VehicleSelectDestination extends StatefulWidget {
  const VehicleSelectDestination({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectDestination();
}

class _VehicleSelectDestination
    extends State<VehicleSelectDestination> {
  final List<Map<String, dynamic>> _allData = [
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
    {'name': '+100 BN KC2'},
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
          'Đến điểm',
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
                          (item) => VehicleDestinationItem(
                            data: item,
                          ),
                        )
                        .toList(),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Về trước'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(
                        context,
                        WorkLogRoutes.vehicleSelectMaterial,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Tiếp tục'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
