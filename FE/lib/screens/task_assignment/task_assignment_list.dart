import 'package:flutter/material.dart';
import 'package:job_manager/models/order_model.dart';
import 'package:job_manager/routes/task_assignment_route.dart';
import 'package:job_manager/services/order_service.dart';
import 'package:job_manager/widgets/task_assignment_item.dart';

class TaskAssignmentList extends StatefulWidget {
  const TaskAssignmentList({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentList();
}

class _TaskAssignmentList
    extends State<TaskAssignmentList> {
  bool _isLoading = true;
  final List<OrderModel> tasks = [];
  final OrderService _orderService = OrderService();

  void getAllOrder() async {
    var result = await _orderService.getAllOrder();
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
        tasks.clear(); // Nếu cần làm sạch danh sách trước
        tasks.addAll(
          (data as List)
              .map((e) => OrderModel.fromJson(e))
              .toList(),
        );
      });
    }
    setState(() {
      _isLoading = false;
    });
  }

  void getReload() async {
    setState(() {
      _isLoading = true;
    });
    getAllOrder();
  }

  @override
  void initState() {
    super.initState();
    getAllOrder();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: Icon(
            Icons.replay_outlined,
            color: Colors.white,
          ),
          onPressed: getReload,
        ),
        title: Text(
          'Giao việc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                TaskAssignmentRoutes.taskAssignmentType,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: Expanded(
        child:
            _isLoading
                ? Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                  child: Column(
                    children:
                        tasks
                            .map(
                              (item) => TaskAssignItem(
                                data: item,
                              ),
                            )
                            .toList(),
                  ),
                ),
      ),
    );
  }
}
