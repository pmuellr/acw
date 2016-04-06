acw - Amazon CloudWatch utility
================================================================================

Utility for Amazon CloudWatch logs.  List available groups, streams for
a group, and messages for a stream.


usage
================================================================================

**`acw ls [<group-name>]`**

If no `<group-name>` is provided, lists all the log groups that are available.

If a `<group-name>` is provided, lists the log streams for the group.

    $ acw ls
    ...
    $ acw ls /aws/lambda/foo
    ...

--------------------------------------------------------------------------------

**`acw dump <group-name> [<prefix>]`**

This command will dump all of the messages of the specified log group for the
streams with the specified prefix, to stdout.  If no prefix is provided,
the current date in the form `yyyy/mm/dd` will be used.

    $ acw dump /aws/lambda/foo
    ...
    $ acw dump /aws/lambda/foo 2016/01/01
    ...


pre-reqs
================================================================================

This command invokes the `aws` command, so you will need to have that installed,
and be logged into it appropriately, before using this command.
