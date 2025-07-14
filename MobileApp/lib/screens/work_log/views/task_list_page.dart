import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/services/socket_service.dart';
import 'package:soft/widgets/task_item.dart';

class TaskListPage extends StatefulWidget {
  const TaskListPage({super.key});

  @override
  State<StatefulWidget> createState() => _TaskListPage();
}

class _TaskListPage extends State<TaskListPage> {
  final List<OrderModel> taskList = [];
  bool _isLoading = true;
  final OrderService _orderService = OrderService();

  void getOrderByUser() async {
    var result = await _orderService.getByUser();
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
        taskList
            .clear(); // Nếu cần làm sạch danh sách trước
        taskList.addAll(
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
    getOrderByUser();
  }

  @override
  void initState() {
    super.initState();
    getOrderByUser();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Công việc được giao',
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            onPressed: getReload,
            icon: Icon(
              Icons.replay_outlined,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: ValueListenableBuilder(
        valueListenable:
            SocketService().notificationNotifier,
        builder: (context, value, _) {
          if (value != null) {
            // Khi có thông báo → reload dữ liệu
            getOrderByUser();
            // Reset notifier để tránh reload liên tục
            WidgetsBinding.instance.addPostFrameCallback((
              _,
            ) {
              SocketService().notificationNotifier.value =
                  null;
            });
          }

          return _isLoading
              ? Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                child: Column(
                  children:
                      taskList
                          .map(
                            (item) => TaskItem(data: item),
                          )
                          .toList(),
                ),
              );
        },
      ),
    );
  }
}
