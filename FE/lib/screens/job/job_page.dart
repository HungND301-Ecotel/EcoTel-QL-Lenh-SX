import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class JobPage extends StatefulWidget {
  const JobPage({super.key});

  @override
  State<StatefulWidget> createState() => _JobPage();
}

class _JobPage extends State<JobPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        title: Text(
          'Công việc được giao',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {},
            icon: Icon(
              Icons.replay_outlined,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Colors.grey.shade200, // màu đường kẻ
                  width: 1, // độ dày
                ),
              ),
            ),
            child: TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(0),
                ),
              ),
              child: Row(
                mainAxisAlignment:
                    MainAxisAlignment.spaceBetween,
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 60,
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Icon(
                        Icons.mark_as_unread_outlined,
                        size: 25,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                  Expanded(
                    child: DefaultTextStyle(
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.black,
                      ),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text('Bảo dưỡng, sửa chữa xe'),
                          SizedBox(height: 10),
                          Text('19/07/2022 15:00:00'),
                          SizedBox(height: 10),
                          Text(
                            'Bảo dưỡng, sửa chữa xe',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 40,
                    child: Icon(
                      Icons.arrow_forward_ios_outlined,
                      size: 15,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
