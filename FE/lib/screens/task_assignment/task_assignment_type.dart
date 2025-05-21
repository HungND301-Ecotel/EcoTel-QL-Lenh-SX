import 'package:flutter/material.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/task_service.dart';

class TaskAssignmentType extends StatefulWidget {
  const TaskAssignmentType({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentType();
}

class _TaskAssignmentType
    extends State<TaskAssignmentType> {
  final List<TaskModel> tasks = [];
  bool _isLoading = true;

  final TaskService _taskService = TaskService();

  void getAllTask() async {
    var result = await _taskService.getAllTask();
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
              .map((e) => TaskModel.fromJson(e))
              .toList(),
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
    getAllTask();
  }

  String _searchText = '';
  @override
  Widget build(BuildContext context) {
    List<TaskModel> filteredTasks =
        tasks
            .where(
              (item) => item.name
                  .toString()
                  .toLowerCase()
                  .contains(_searchText.toLowerCase()),
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
                _isLoading
                    ? Center(
                      child: CircularProgressIndicator(),
                    )
                    : filteredTasks.isEmpty
                    ? Center(child: Text('Không tìm thấy'))
                    : ListView.builder(
                      itemCount: filteredTasks.length,
                      itemBuilder: (context, index) {
                        final item = filteredTasks[index];
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
                              Icons.group_work_outlined,
                              color: Colors.grey,
                            ),
                            title: Text(item.name),
                            onTap: () {
                              Navigator.pushNamed(
                                context,
                                TaskAssignmentRoutes
                                    .taskAssignmentAdd,
                                arguments: {'task': item},
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
