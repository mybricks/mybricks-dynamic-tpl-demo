import React, { useMemo } from 'react'

import ReactDOM from 'react-dom'
import { Button } from 'antd'
import templateDumpJSON from './testTpl.json'

const container = document.getElementById('root')
const root = ReactDOM.createRoot(container)

root.render(<MyApp />)

function MyApp() {
  return <Template />
}

interface CommandParams {
  init: (params: { comLibs: any[]; dumpJSON: any }) => { dump; getCom }
  getCom: (params: { sceneTitle?: string; comTitle?: string }) => any
  dump: () => any
  appendCom
  appendScene
  removeCom
}

// 引擎命令 API
const command: CommandParams = (window as any).mybricks.command

// 模型数据demo，来源于后端建模，具体数据结构可以自定义，此处只做模拟
const demoModel = {
  username: {
    fieldName: '姓名',
    fieldKey: 'username',
    type: 'string',
  },
  sex: {
    fieldName: '性别',
    fieldKey: 'sex',
    type: 'enum',
  },
}

function Template() {
  // 获取组件库信息
  const libs = useMemo(() => {
    let libsInWindow = window['__comlibs_edit_']

    return libsInWindow
  }, [])

  const toPageJson = () => {
    const templateJSON = JSON.stringify(templateDumpJSON)

    // 初始化模板实例
    const template = command.init({
      comLibs: libs, // 组件库信息
      dumpJSON: templateJSON, // 模板页面 json，来源于模板页面，可以随便搭建一张页面，其中有 表单与表格即可，当前会以操作这两个组件作为示例
    })

    // 解析模型
    const pageConfig = parseModel(demoModel)

    // 获取模版中某场景下的某个组件
    // 从模板中获取表单
    const comForm = template.getCom({
      sceneTitle: '主场景',
      comTitle: '表单容器',
    })

    // 从模板中获取表格
    const comTable = template.getCom({
      sceneTitle: '主场景',
      comTitle: '数据表格',
    })

    const newItems = pageConfig.formItems.map((item) => {
      // 模型类型映射对应的表单项类型的 namespace, 此处来源于 PC 通用组件库
      const formItemNamespaceMap = {
        string: 'mybricks.normal-pc.form-text',
        enum: 'mybricks.normal-pc.select',
      }
      // 给表单容器的插槽添加组件，同时返回当前组件的信息
      const comItem = comForm.slots[0].appendChild({
        namespace: formItemNamespaceMap[item.type],
      })

      return {
        id: comItem.id,
        props: {
          label: item.label,
          name: item.name,
        },
      }
    })

    // 修改模板页面中的表单数据
    comForm.data.items = comForm.data.items.map((formItem) => {
      const configItem = newItems.find((item) => item.id === formItem.id)

      return {
        ...formItem,
        ...configItem?.props,
      }
    })

    // 修改模板页面中的表格数据
    const newColumns = pageConfig.tableCol.map((item) => {
      return { ...item, contentType: 'text' }
    })

    comTable.data.columns = newColumns

    // 导出生成的页面 json
    const json = template.dump()

    console.log(JSON.stringify(json))
  }

  return (
    <div style={{ padding: '20px' }}>
      <Button onClick={toPageJson}>测试生成</Button>
      <h2>
        点击后，在控制中拿到对应的数据复制后，可以通过导入的形式到页面中查看效果
      </h2>
    </div>
  )
}
/**
 * @description 解析模型，输出用于生成页面的数据结构
 */
const parseModel = (model) => {
  const pageConfig: any = {
    formItems: [],
    tableCol: [],
  }

  Object.keys(model).forEach((key) => {
    const modelItem = model[key]

    pageConfig.formItems.push({
      label: modelItem.fieldName,
      name: modelItem.fieldKey,
      type: modelItem.type,
    })

    pageConfig.tableCol.push({
      title: modelItem.fieldName,
      dataIndex: modelItem.fieldKey,
    })
  })

  return pageConfig
}
