import {createFakeUserAndLogin} from '../../support/authenticateUser'

import {BucketFactory} from '../../factories/bucket'
import {ProjectFactory} from '../../factories/project'
import {TaskFactory} from '../../factories/task'
import {prepareProjects} from './prepareProjects'

describe('Project View Kanban', () => {
	createFakeUserAndLogin()
	prepareProjects()
	
	let buckets
	beforeEach(() => {
		buckets = BucketFactory.create(2)
	})

	it('Shows all buckets with their tasks', () => {
		const data = TaskFactory.create(10, {
			project_id: 1,
			bucket_id: 1,
		})
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .title')
			.contains(buckets[0].title)
			.should('exist')
		cy.get('.kanban .bucket .title')
			.contains(buckets[1].title)
			.should('exist')
		cy.get('.kanban .bucket')
			.first()
			.should('contain', data[0].title)
	})

	it('Can add a new task to a bucket', () => {
		TaskFactory.create(2, {
			project_id: 1,
			bucket_id: 1,
		})
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket')
			.contains(buckets[0].title)
			.get('.bucket-footer .button')
			.contains('Add another task')
			.click()
		cy.get('.kanban .bucket')
			.contains(buckets[0].title)
			.get('.bucket-footer .field .control input.input')
			.type('New Task{enter}')

		cy.get('.kanban .bucket')
			.first()
			.should('contain', 'New Task')
	})

	it('Can create a new bucket', () => {
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket.new-bucket .button')
			.click()
		cy.get('.kanban .bucket.new-bucket input.input')
			.type('New Bucket{enter}')

		cy.wait(1000) // Wait for the request to finish
		cy.get('.kanban .bucket .title')
			.contains('New Bucket')
			.should('exist')
	})

	it('Can set a bucket limit', () => {
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .bucket-header .dropdown.options .dropdown-trigger')
			.first()
			.click()
		cy.get('.kanban .bucket .bucket-header .dropdown.options .dropdown-menu .dropdown-item')
			.contains('Limit: Not Set')
			.click()
		cy.get('.kanban .bucket .bucket-header .dropdown.options .dropdown-menu .dropdown-item .field input.input')
			.first()
			.type(3)
		cy.get('[data-cy="setBucketLimit"]')
			.first()
			.click()

		cy.get('.kanban .bucket .bucket-header span.limit')
			.contains('0/3')
			.should('exist')
	})

	it('Can rename a bucket', () => {
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .bucket-header .title')
			.first()
			.type('{selectall}New Bucket Title{enter}')
		cy.get('.kanban .bucket .bucket-header .title')
			.first()
			.should('contain', 'New Bucket Title')
	})

	it('Can delete a bucket', () => {
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .bucket-header .dropdown.options .dropdown-trigger')
			.first()
			.click()
		cy.get('.kanban .bucket .bucket-header .dropdown.options .dropdown-menu .dropdown-item')
			.contains('Delete')
			.click()
		cy.get('.modal-mask .modal-container .modal-content .header')
			.should('contain', 'Delete the bucket')
		cy.get('.modal-mask .modal-container .modal-content .actions .button')
			.contains('Do it!')
			.click()

		cy.get('.kanban .bucket .title')
			.contains(buckets[0].title)
			.should('not.exist')
		cy.get('.kanban .bucket .title')
			.contains(buckets[1].title)
			.should('exist')
	})

	it('Can drag tasks around', () => {
		const tasks = TaskFactory.create(2, {
			project_id: 1,
			bucket_id: 1,
		})
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .tasks .task')
			.contains(tasks[0].title)
			.first()
			.drag('.kanban .bucket:nth-child(2) .tasks')
		
		cy.get('.kanban .bucket:nth-child(2) .tasks')
			.should('contain', tasks[0].title)
		cy.get('.kanban .bucket:nth-child(1) .tasks')
			.should('not.contain', tasks[0].title)
	})

	it('Should navigate to the task when the task card is clicked', () => {
		const tasks = TaskFactory.create(5, {
			id: '{increment}',
			project_id: 1,
			bucket_id: 1,
		})
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .tasks .task')
			.contains(tasks[0].title)
			.should('be.visible')
			.click()

		cy.url()
			.should('contain', `/tasks/${tasks[0].id}`, { timeout: 1000 })
	})

	it('Should remove a task from the kanban board when moving it to another project', () => {
		const projects = ProjectFactory.create(2)
		BucketFactory.create(2, {
			project_id: '{increment}',
		})
		const tasks = TaskFactory.create(5, {
			id: '{increment}',
			project_id: 1,
			bucket_id: 1,
		})
		const task = tasks[0]
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .tasks .task')
			.contains(task.title)
			.should('be.visible')
			.click()

		cy.get('.task-view .action-buttons .button', { timeout: 3000 })
			.contains('Move')
			.click()
		cy.get('.task-view .content.details .field .multiselect.control .input-wrapper input')
			.type(`${projects[1].title}{enter}`)
		// The requests happen with a 200ms timeout. Because of that, the results are not yet there when cypress
		// presses enter and we can't simulate pressing on enter to select the item.
		cy.get('.task-view .content.details .field .multiselect.control .search-results')
			.children()
			.first()
			.click()

		cy.get('.global-notification', { timeout: 1000 })
			.should('contain', 'Success')
		cy.go('back')
		cy.get('.kanban .bucket')
			.should('not.contain', task.title)
	})
	
	it('Shows a button to filter the kanban board', () => {
		const data = TaskFactory.create(10, {
			project_id: 1,
			bucket_id: 1,
		})
		cy.visit('/projects/1/kanban')
		
		cy.get('.project-kanban .filter-container .base-button')
			.should('exist')
	})
	
	it('Should remove a task from the board when deleting it', () => {
		const projects = ProjectFactory.create(1)
		const buckets = BucketFactory.create(2, {
			project_id: projects[0].id,
		})
		const tasks = TaskFactory.create(5, {
			project_id: 1,
			bucket_id: buckets[0].id,
		})
		const task = tasks[0]
		cy.visit('/projects/1/kanban')

		cy.get('.kanban .bucket .tasks .task')
			.contains(task.title)
			.should('be.visible')
			.click()
		cy.get('.task-view .action-buttons .button')
			.should('be.visible')
			.contains('Delete')
			.click()
		cy.get('.modal-mask .modal-container .modal-content .header')
			.should('contain', 'Delete this task')
		cy.get('.modal-mask .modal-container .modal-content .actions .button')
			.contains('Do it!')
			.click()

		cy.get('.global-notification')
			.should('contain', 'Success')
		
		cy.get('.kanban .bucket .tasks')
			.should('not.contain', task.title)
	})
})