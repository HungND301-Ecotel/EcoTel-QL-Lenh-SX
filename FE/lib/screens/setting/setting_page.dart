import 'package:flutter/material.dart';

class SettingPage extends StatelessWidget {
  const SettingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Cài đặt"),
        centerTitle: true,
        automaticallyImplyLeading: false,
        backgroundColor: Colors.blue,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              "Tài khoản ",
              style: TextStyle(
                color: Colors.blue,
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: 16),
            ),
            child: Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,
              children: [
                SizedBox(
                  width: 60,
                  child: Icon(
                    Icons.key,
                    size: 25,
                    color: Colors.orange,
                  ),
                ),
                Expanded(
                  child: Text(
                    "Đổi mật khẩu",
                    style: TextStyle(color: Colors.black),
                  ),
                ),
                SizedBox(
                  width: 30,
                  child: Icon(
                    Icons.arrow_forward_ios,
                    size: 15,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: 16),
            ),
            child: Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,
              children: [
                SizedBox(
                  width: 60,
                  child: Icon(
                    Icons.credit_card_outlined,
                    size: 25,
                    color: Colors.blue,
                  ),
                ),
                Expanded(
                  child: Text(
                    "Đăng ký tài khoản ngân hàng",
                    style: TextStyle(color: Colors.black),
                  ),
                ),
                SizedBox(
                  width: 30,
                  child: Icon(
                    Icons.arrow_forward_ios,
                    size: 15,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: 16),
            ),
            child: Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,
              children: [
                SizedBox(
                  width: 60,
                  child: Icon(
                    Icons.document_scanner_outlined,
                    size: 25,
                    color: Colors.green,
                  ),
                ),
                Expanded(
                  child: Text(
                    "Quản lý giấy tờ lái xe",
                    style: TextStyle(color: Colors.black),
                  ),
                ),
                SizedBox(
                  width: 30,
                  child: Icon(
                    Icons.arrow_forward_ios,
                    size: 15,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: 16),
            ),
            child: Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,
              children: [
                SizedBox(
                  width: 60,
                  child: Icon(
                    Icons.logout,
                    size: 25,
                    color: Colors.yellow,
                  ),
                ),
                Expanded(
                  child: Text(
                    "Đăng xuất",
                    style: TextStyle(color: Colors.black),
                  ),
                ),
                SizedBox(
                  width: 30,
                  child: Icon(
                    Icons.arrow_forward_ios,
                    size: 15,
                    color: Colors.black,
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
