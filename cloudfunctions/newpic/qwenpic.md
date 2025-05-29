模型简介




模型版本

模型名称

模型简介

通义万相文生图2.1

wanx2.1-t2i-turbo

生成速度更快，通用生成模型。

wanx2.1-t2i-plus

生成图像细节更丰富，速度稍慢，通用生成模型。

通义万相文生图2.0

wanx2.0-t2i-turbo

擅长质感人像与创意设计，速度中等，性价比高。







模型名称

计费单价

限流（主账号与RAM子账号共用）

免费额度

任务下发接口QPS限制

同时处理中任务数量

wanx2.1-t2i-turbo

0.14元/张

2

2

免费额度：各500张

有效期：阿里云百炼开通后180天内

wanx2.1-t2i-plus

0.20元/张

2

2

wanx2.0-t2i-turbo

0.04元/张

2

2

更多说明请参见模型计费及限流。

如果您需要切换文生图模型，请参见wanx-v1模型切换到V2版模型。

前提条件
文生图V2版API支持通过HTTP和DashScope SDK进行调用。

在调用前，您需要开通模型服务并获取API Key，再配置API Key到环境变量。

如需通过SDK进行调用，请安装DashScope SDK。目前，该SDK已支持Python和Java。

HTTP调用
图像模型处理时间较长，为了避免请求超时，HTTP调用仅支持异步获取模型结果。您需要发起两个请求：

创建任务获取任务ID：首先发起创建任务请求，该请求会返回任务ID（task_id）。

根据任务ID查询结果：使用上一步获得的任务ID，查询任务状态及结果。任务成功执行时将返回图像URL，有效期24小时。

说明
创建任务后，该任务将被加入到排队队列，等待调度执行。后续需要调用“根据任务ID查询结果接口”获取任务状态及结果。

文生图耗时约1-3分钟，具体耗时受限于排队任务数和服务执行情况，请您在获取结果时耐心等待。
步骤1：创建任务获取任务ID
POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis

请求参数
文字作画
正向提示词正向+反向提示词
根据prompt生成图像。

 
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis \
    -H 'X-DashScope-Async: enable' \
    -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
    "model": "wanx2.1-t2i-turbo",
    "input": {
        "prompt": "一间有着精致窗户的花店，漂亮的木质门，摆放着花朵"
    },
    "parameters": {
        "size": "1024*1024",
        "n": 1
    }
}'    
请求头（Headers）
Content-Type string （必选）

请求内容类型。此参数必须设置为application/json。

Authorization string（必选）

请求身份认证。接口使用阿里云百炼API-Key进行身份认证。示例值：Bearer d1xxx2a。

X-DashScope-Async string （必选）

异步处理配置参数。HTTP请求只支持异步，必须设置为enable。

请求体（Request Body）
model string （必选）

模型名称。示例值：wanx2.1-t2i-turbo。

input object （必选）

输入的基本信息，如提示词等。

属性

prompt string （必选）

正向提示词，用来描述生成图像中期望包含的元素和视觉特点。

支持中英文，长度不超过800个字符，每个汉字/字母占一个字符，超过部分会自动截断。

示例值：一只坐着的橘黄色的猫，表情愉悦，活泼可爱，逼真准确。

提示词的使用技巧请参见文生图Prompt指南。

negative_prompt string （可选）

反向提示词，用来描述不希望在画面中看到的内容，可以对画面进行限制。

支持中英文，长度不超过500个字符，超过部分会自动截断。

示例值：低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良等。

parameters object （可选）

图像处理参数。

属性

size string （可选）

输出图像的分辨率。默认值是1024*1024。

图像宽高边长的像素范围为：[512, 1440]，单位像素。可任意组合以设置不同的图像分辨率，最高可达200万像素。

n integer （可选）

生成图片的数量。取值范围为1~4张，默认为4。

seed integer （可选）

随机数种子，用于控制模型生成内容的随机性。seed参数取值范围是[0, 2147483647]。

如果不提供，则算法自动生成一个随机数作为种子。如果给定了，则根据n的值分别为n张图片生成seed参数，例如n=4，算法将分别生成seed、seed+1、seed+2、seed+3作为参数的图片。

如果您希望生成内容保持相对稳定，请使用相同的seed参数值。

prompt_extend bool （可选）

是否开启prompt智能改写。开启后会使用大模型对输入prompt进行智能改写，仅对正向提示词有效。对于较短的输入prompt生成效果提升明显，但会增加3-4秒耗时。

true：默认值，开启智能改写。

false：不开启智能改写。

watermark bool （可选）

是否添加水印标识，水印位于图片右下角，文案为“AI生成”。

false：默认值，不添加水印。

true：添加水印。

响应参数
成功响应异常响应
 
{
    "output": {
        "task_status": "PENDING",
        "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx"
    },
    "request_id": "4909100c-7b5a-9f92-bfe5-xxxxxx"
}
output object

任务输出信息。

属性

task_id string

任务ID。

task_status string

任务状态。

枚举值

PENDING：任务排队中

RUNNING：任务处理中

SUCCEEDED：任务执行成功

FAILED：任务执行失败

CANCELED：任务取消成功

UNKNOWN：任务不存在或状态未知

request_id string

请求唯一标识。可用于请求明细溯源和问题排查。

code string

请求失败的错误码。请求成功时不会返回此参数，详情请参见错误信息。

message string

请求失败的详细信息。请求成功时不会返回此参数，详情请参见错误信息。

步骤2：根据任务ID查询结果
GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}

请求参数
查询任务结果
您需要将86ecf553-d340-4e21-xxxxxxxxx替换为真实的task_id。

 
curl -X GET \
--header "Authorization: Bearer $DASHSCOPE_API_KEY" \
https://dashscope.aliyuncs.com/api/v1/tasks/86ecf553-d340-4e21-xxxxxxxxx
请求头（Headers）
Authorization string（必选）

请求身份认证。接口使用阿里云百炼API-Key进行身份认证。示例值：Bearer d1xxx2a。

URL路径参数（Path parameters）
task_id string（必选）

任务ID。

响应参数
任务执行成功任务执行失败任务部分失败
任务数据（如任务状态、图像URL等）仅保留24小时，超时后会被自动清除。请您务必及时保存生成的图像。

 
{
    "request_id": "f767d108-7d50-908b-a6d9-xxxxxx",
    "output": {
        "task_id": "d492bffd-10b5-4169-b639-xxxxxx",
        "task_status": "SUCCEEDED",
        "submit_time": "2025-01-08 16:03:59.840",
        "scheduled_time": "2025-01-08 16:03:59.863",
        "end_time": "2025-01-08 16:04:10.660",
        "results": [
            {
                "orig_prompt": "一间有着精致窗户的花店，漂亮的木质门，摆放着花朵",
                "actual_prompt": "一间有着精致雕花窗户的花店，漂亮的深色木质门上挂着铜制把手。店内摆放着各式各样的鲜花，包括玫瑰、百合和向日葵，色彩鲜艳，生机勃勃。背景是温馨的室内场景，透过窗户可以看到街道。高清写实摄影，中景构图。",
                "url": "https://dashscope-result-wlcb.oss-cn-wulanchabu.aliyuncs.com/1.png"
            }
        ],
        "task_metrics": {
            "TOTAL": 1,
            "SUCCEEDED": 1,
            "FAILED": 0
        }
    },
    "usage": {
        "image_count": 1
    }
}
output object

任务输出信息。

属性

task_id string

任务ID。

task_status string

任务状态。

枚举值

PENDING：任务排队中

RUNNING：任务处理中

SUCCEEDED：任务执行成功

FAILED：任务执行失败

CANCELED：任务取消成功

UNKNOWN：任务不存在或状态未知

submit_time string

任务提交时间。

scheduled_time string

任务执行时间。

end_time string

任务完成时间。

results array object

任务结果列表，包括图像URL、prompt、部分任务执行失败报错信息等。

数据结构

属性

orig_prompt string

原始的输入prompt。

actual_prompt string

开启prompt智能改写后实际使用的prompt。当不开启prompt智能改写时，该字段不会返回。

url string

模型生成图片的URL地址。

code string

图像错误码。部分任务执行失败时会返回该字段。

message string

图像错误信息。部分任务执行失败时会返回该字段。

task_metrics object

任务结果统计。

属性

TOTAL integer

总的任务数。

SUCCEEDED integer

任务状态为成功的任务数。

FAILED integer

任务状态为失败的任务数。

code string

请求失败的错误码。请求成功时不会返回此参数，详情请参见错误信息。

message string

请求失败的详细信息。请求成功时不会返回此参数，详情请参见错误信息。

usage object

输出信息统计。只对成功的结果计数。

属性

image_count integer

模型生成图片的数量。

request_id string

请求唯一标识。可用于请求明细溯源和问题排查。