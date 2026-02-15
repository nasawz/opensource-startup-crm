鸿蒙Agent通信协议使能应用智能体基于华为账号一键授权登录方案

关键技术点：

1）开发者需要在华为开发者联盟账号服务获取一个appId，并将appId在华为开发者联盟小艺开放平台智能体开发页面注册保存。

2）小艺APP在加载三方智能体页面时会从小艺开放平台获取到智能体的appId。

3）用户在使用三方智能体时，可以在智能体内点击账号授权，发起账号授权流程，如果用户已经授权过，则静默发起授权流程到三方智能体服务器，三方智能体服务器返回新的agentLoginSessionId，如果用户未授权过，则给用户弹框获取用户授权，三方智能体服务器基于华为账号分配的授权码获取用户手机号，然后返回新的agentLoginSessionId。

4）小艺APP保存该智能体的agentLoginSessionId，后续用户给该智能体发消息时携带该字段给三方智能体服务器。

5）小艺APP会在agentLoginSessionId超期失效或不存在时重新发起账号授权流程，从三方智能体服务器申请新的agentLoginSessionId。



_________

宿主APP代智能体获取用户授权信息（比如手机号）

Agent Client发送从账号获取的授权码给Agent Server：
curl 'https://xxx/agent/message' \
-H 'Content-Type: application/json’ \
-H 'agent-session-id:8f01f3d172cd4396a0e535ae8aec6687 ’\
-d ‘{
    "jsonrpc": "2.0",
    "id": "{{与agent-server通信的全局唯一消息序列号，字符串表示}}",
    "method": "authorize",
    "params": {
        "message": {
            "role": "user",
            "parts": [{
                "kind": "data",
                "data": {
                    "authCode": "{{宿主APP代智能体从华为账号获取用户授权后的授权码}}"
                } 
            }]
        }
    }
}'


Agent Client获取Agent Server授权响应：
{
    "jsonrpc": "2.0",
    "id": "{{与agent-server通信的全局唯一消息序列号，从请求中取出该字段返回}}",
    "result": {
        "version": "1.0",
         "agentLoginSessionId": "{{agent server在用户登录成功后返回的用户登录凭证唯一ID}}"
    },
    "error": {
        "code": "{{JSONRPCError错误码， 整形或字符串类型，0表示成功}}",
        "message": "{{JSONRPCError错误描述}}"
    }
}


Agent Client发送解除账号授权消息给Agent Server：
curl 'https://xxx/agent/message' \
-H 'Content-Type: application/json’ \
-H 'agent-session-id:a9bb617f2cd94bd585da0f88ce2ddba2 ’\
-d ‘{
    "jsonrpc": "2.0",
    "id": "{{与agent-server通信的全局唯一消息序列号，字符串表示}}",
    "method": "deauthorize",
    "params": {
        "message": {
            "role": "user",
            "parts": [{
                "kind": "data",
                "data": {
                    "agentLoginSessionId": "{{agent server在用户登录成功后返回的会话凭证唯一ID}}",
                    "cpUserId": "{{agent server在支付场景下返回的标识CP侧用户唯一标识符的ID}}"
                }
            }]
        }
    }
}'

Agent Client获取Agent Server解除授权响应：
{
    "jsonrpc": "2.0",
    "id": "{{与agent-server通信的全局唯一消息序列号，从请求中取出该字段返回}}",
     "result": {
        "version": "1.0",
     },
    "error": {
        "code": "{{JSONRPCError错误码， 整形或字符串类型，0表示成功}}",
        "message": "{{JSONRPCError错误描述}}"
    }
}