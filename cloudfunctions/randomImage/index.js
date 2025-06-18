// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云存储基础路径
const BASE_PATH = '/images/';

/**
 * 使用云开发接口列出云存储中的文件
 * @param {string} folder - 文件夹路径，如 'img1/'
 * @returns {Promise<Array>} 文件列表
 */
async function listFilesInFolder(folder) {
  try {
    // 注意：微信小程序云开发对列出文件没有直接的API
    // 这里使用数据库存储文件记录来模拟文件列表功能
    
    // 检查是否存在 image_paths 集合
    const db = cloud.database();
    let hasCollection = false;
    
    try {
      const collections = await db.listCollections().get();
      hasCollection = collections.data.some(collection => collection.name === 'image_paths');
    } catch (e) {
      console.log('查询集合列表失败:', e);
    }
    
    if (hasCollection) {
      // 从集合中获取文件列表
      const res = await db.collection('image_paths')
        .where({
          path: new RegExp(`^${folder}`)
        })
        .get();
      
      if (res.data && res.data.length > 0) {
        return res.data.map(item => item.fileID || item.filePath);
      }
    }
    
    // 如果没有集合或集合中没有匹配的数据，则模拟一些文件路径
    return generateFakeFilePaths(folder);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return generateFakeFilePaths(folder);
  }
}

/**
 * 生成模拟的文件路径
 * @param {string} folder - 文件夹路径，如 'img1/'
 * @returns {Array} 生成的文件路径数组
 */
function generateFakeFilePaths(folder) {
  const envId = process.env.TCB_ENV || 'cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413';
  const count = Math.max(5, Math.floor(Math.random() * 10) + 1); // 生成 1-10 个文件
  const fileIDs = [];
  
  for (let i = 1; i <= count; i++) {
    // 直接使用文件夹和文件名构造正确的云存储路径
    fileIDs.push(`cloud://${envId}${BASE_PATH}${folder}${i}.jpg`);
  }
  
  return fileIDs;
}

// 定义每个数字对应的固定图片
const fixedImages = {
  1: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img1/自然风光.png',
  2: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img2/温馨场景.jpeg',
  3: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img3/抽象艺术.jpeg',
  4: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img4/隐喻象征.jpeg',
  5: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img5/极简主义.jpeg',
  6: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img6/童年记忆.png',
  7: 'cloud://cloud1-4gythsnw8615145d.636c-cloud1-4gythsnw8615145d-1360168413/images/img7/1.jpg'  // 第7个还保留随机默认
};

// 云函数入口函数
exports.main = async (event, context) => {
  const { folderNum } = event;
  
  // 检查输入是否有效（应该为1-7之间的数字）
  const num = parseInt(folderNum);
  if (isNaN(num) || num < 1 || num > 7) {
    return {
      success: false,
      message: '请输入1-7之间的数字',
      data: null
    };
  }
  
  try {
    // 根据输入数字返回对应的固定图片
    const fixedFileID = fixedImages[num];
    console.log(`根据输入 ${num} 返回图片ID: ${fixedFileID}`);
    
    // 获取文件的临时访问 URL
    const result = await cloud.getTempFileURL({
      fileList: [fixedFileID]
    });
    console.log('getTempFileURL结果:', result);
    
    const { fileList } = result;
    
    if (fileList && fileList.length > 0 && fileList[0].tempFileURL) {
      return {
        success: true,
        message: '获取图片成功',
        data: {
          fileID: fileList[0].fileID,
          tempFileURL: fileList[0].tempFileURL,
          folder: `img${num}/`,
          imageType: num
        }
      };
    } else {
      // 如果获取临时链接失败
      console.log('未能获取临时URL, fileList:', fileList);
      return {
        success: false,
        message: '获取图片的临时URL失败',
        data: {
          fileID: fixedFileID,
          tempFileURL: null,
          folder: `img${num}/`,
          imageType: num,
          fileList: fileList
        }
      };
    }
  } catch (error) {
    console.error('获取图片失败:', error);
    
    // 错误时也返回对应的固定图片ID
    const fixedFileID = fixedImages[num];
    
    return {
      success: false,
      message: '获取图片失败: ' + error.message,
      data: {
        fileID: fixedFileID,
        tempFileURL: null,
        folder: `img${num}/`,
        imageType: num,
        error: error.message
      }
    };
  }
}
