import 'package:flutter/material.dart';

class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key});

  @override
  State<StatefulWidget> createState() =>
      _NotificationPage();
}

class _NotificationPage extends State<NotificationPage> {
  final List<Map<String, dynamic>> data = [
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
    {
      'name': 'Xe CKCD1-D8R05',
      'description': 'Dừng lâu - 30 phút',
      'time': '06/05/2025 00:32:34',
      'date': '06/05/2025',
    },
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Thông báo',
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white),
        backgroundColor: Colors.blue,
      ),
      body: SingleChildScrollView(
        child: Column(
          children:
              data
                  .map(
                    (item) => Container(
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                      ),
                      child: ListTile(
                        leading: Icon(
                          Icons.mark_as_unread_outlined,
                          color: Colors.blue,
                        ),
                        title: Column(
                          children: [
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment
                                      .spaceBetween,
                              children: [
                                Text(item['description']),
                                Text(item['date']),
                              ],
                            ),
                            Text(
                              "${item['time']}:${item['name']}",
                              maxLines: 1,
                            ),
                          ],
                        ),
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
    );
  }
}
