import 'package:flutter/material.dart';

class ButtonSave extends StatefulWidget {
  final bool canSave;
  final Function() create;
  const ButtonSave(
      {super.key,
      required this.canSave,
      required this.create});

  @override
  State<StatefulWidget> createState() => _ButtonSaveState();
}

class _ButtonSaveState extends State<ButtonSave> {
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: !widget.canSave
          ? null
          : () {
              showDialog(
                context: context,
                builder: (
                  BuildContext dialogContext,
                ) =>
                    AlertDialog(
                  title: Text(
                    "Xác nhận",
                  ),
                  content: Text(
                    "Xác nhận lưu",
                  ),
                  actions: [
                    TextButton(
                      onPressed: () {
                        Navigator.of(
                          dialogContext,
                        ).pop();
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.blue,
                      ),
                      child: Text(
                        "Bỏ qua",
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(
                          dialogContext,
                        ).pop();
                        widget.create();
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.blue,
                      ),
                      child: Text(
                        "Lưu lại",
                      ),
                    ),
                  ],
                ),
              );
            },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      child: Text('Ghi lại'),
    );
  }
}
