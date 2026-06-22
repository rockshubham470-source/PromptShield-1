import { useNotificationStore } from '../stores/notificationStore'
import { Notification } from '../types/notification'

class ToastService {
  private toastContainer: HTMLElement | null = null

  private getToastContainer(): HTMLElement {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div')
      this.toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse space-y-3 pointer-events-auto'
      document.body.appendChild(this.toastContainer)
    }
    return this.toastContainer
  }

  show(notification: Notification) {
    const container = this.getToastContainer()

    const toast = document.createElement('div')
    toast.className = `
      flex items-start gap-4 w-64 p-4 bg-[#111827] border border-white/10 rounded-xl
      shadow-lg transform transition-all duration-300
      translate-x-full opacity-0
    `

    // Animate in
    requestAnimationFrame(() => {
      toast.className = toast.className.replace(
        'translate-x-full opacity-0',
        'translate-x-0 opacity-100'
      )
    })

    // Get SVG icon based on category
    const getCategoryIcon = (category: Notification['category']): string => {
      switch (category) {
        case 'security':
          return '<svg size="20" className="text-red-400"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 19.065a3.255 3.255 0 110-6.51 3.255 3.255 0 010 6.51zm0-10.765a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM9.375 7.25h3.25v3.25h-3.25V7.25z"/></svg>'
        case 'billing':
          return '<svg size="20" className="text-yellow-400"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75S6.615 21.75 12 21.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.85 13.05h3.7V15.1h-1.15V11.25h2.45v1.5h-2.45v2.6h-1.15V15.3zm6.9-8.1H15v1.5h2.4V9.75H16.8v-.85h1.65V6.6h-2.4V5.1h-1.6V2.25h-1.47v2.65z"/></svg>'
        case 'system':
        default:
          return '<svg size="20" className="text-blue-400"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75S6.615 21.75 12 21.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 19.065a3.255 3.255 0 110-6.51 3.255 3.255 0 010 6.51zm0-10.765a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM9.375 7.25h3.25v3.25h-3.25V7.25z"/></svg>'
      }
    }

    toast.innerHTML = `
      <div className="flex-shrink-0 mt-1">
        ${getCategoryIcon(notification.category)}
      </div>
      <div className="flex-1 space-y-1">
        <p className="font-medium text-white">${notification.title}</p>
        <p className="text-sm text-gray-400">${notification.message}</p>
      </div>
      <button onclick="this.parentElement.remove()"
              className="absolute top-2 right-2 text-gray-400 hover:text-white">
        ×
      </button>
    `

    // Add click handler to mark as read and focus on notifications
    toast.onclick = (e: MouseEvent) => {
      // Don't trigger if clicking the close button
      if ((e.target as HTMLElement).tagName === 'BUTTON') return

      // Mark as read
      const store = useNotificationStore.getState()
      store.markAsRead(notification.id)

      // Remove toast
      container.removeChild(toast)

      // TODO: Optionally navigate to notifications page or focus on bell
    }

    container.insertBefore(toast, container.firstChild)

    // Auto remove after timeout
    setTimeout(() => {
      if (toast.parentElement) {
        toast.className = toast.className.replace(
          'translate-x-0 opacity-100',
          'translate-x-full opacity-0'
        )
        setTimeout(() => {
          if (toast.parentElement) {
            container.removeChild(toast)
          }
        }, 300)
      }
    }, 5000)
  }
}

// Create a singleton instance
export const toastService = new ToastService()