import { TodosAccess } from '../helpers/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'
import { getUserId } from '../lambda/utils'
import { TodoUpdate } from '../models/TodoUpdate'

// TODO: Implement businessLogic
const logger = createLogger('todos')

const todoAccess = new TodosAccess()

export async function createTodo(createTodoRequest : CreateTodoRequest, event: any): Promise<TodoItem> {
  try {
    const userId = getUserId(event)
    const newTodoId = uuid.v4()

    logger.info('create new todo with id', {
      key: newTodoId,
      time : new Date().toISOString()
    })

    const imageUrl = await AttachmentUtils(newTodoId)

    return await todoAccess.createTodo({
      userId: userId,
      todoId: newTodoId,
      name: createTodoRequest.name,
      dueDate: createTodoRequest.dueDate,
      createdAt: new Date().toISOString(),
      done: false,
      attachmentUrl: imageUrl
    })
  }catch(e){
    createError(e);
  }
}

export async function updateTodo(updateTodoRequest : UpdateTodoRequest, todoId : string, userId : string): Promise<TodoUpdate> {
  try {
    logger.info('update todo with id', {
      key: todoId,
      time : new Date().toISOString()
    })

    return await todoAccess.updateTodo({
      name: updateTodoRequest.name,
      dueDate: updateTodoRequest.dueDate,
      done: updateTodoRequest.done
    }, todoId, userId)
  }catch (e) {
    createError(e)
  }

}

export async function getTodosForUser(userId : string ): Promise <TodoItem []> {
  return await todoAccess.getAllTodos(userId)
}

export async function deleteTodo(todoId : string){
  try {
    logger.info('delete todo with id', {
      key: todoId,
      time : new Date().toISOString()
    })

    return await todoAccess.deleteTodo(todoId)
  }catch (e) {
    createError(e)
  }
}

export async function createAttachmentPresignedUrl(attachmentId : string){
  try {

    logger.info('create attachment with id', {
      key: attachmentId,
      time : new Date().toISOString()
    })

    return await AttachmentUtils(attachmentId);
  }catch (e) {
    createError(e)
  }
}


