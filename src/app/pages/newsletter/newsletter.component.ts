import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent implements OnInit {
  // Feature toggle
  newsletterEnabled = false;
  canEditToggle = false;
  toggleLoading = true;

  // Stats
  subscriberCount = 0;
  activeUserCount = 0;
  totalUsers = 0;
  statsLoading = true;

  // User list for selection
  users: any[] = [];
  usersLoading = false;
  page = 0;
  size = 50;
  totalPages = 0;
  filterEmail = '';

  // Selection
  selectedEmails: Set<string> = new Set();
  selectAll = false;

  // Email composer
  emailSubject = '';
  emailBody = '';
  target: 'subscribers' | 'active' | 'selected' = 'subscribers';
  sending = false;
  attachments: File[] = [];

  // Toasts
  toasts: { message: string; type: string }[] = [];

  // Quill editor toolbar configuration
  editorModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['blockquote'],
      ['link', 'image'],
      ['clean']
    ]
  };

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadToggle();
    this.loadStats();
    this.loadUsers();
  }

  loadToggle(): void {
    this.toggleLoading = true;
    this.api.getNewsletterEnabled().subscribe({
      next: (data: any) => {
        this.newsletterEnabled = data.enabled;
        this.canEditToggle = data.canEditToggle;
        this.toggleLoading = false;
      },
      error: () => { this.toggleLoading = false; }
    });
  }

  updateToggle(): void {
    const newVal = !this.newsletterEnabled;
    this.api.updateNewsletterEnabled(newVal).subscribe({
      next: (data: any) => {
        this.newsletterEnabled = data.enabled;
        this.showToast(`Newsletter feature ${data.enabled ? 'enabled' : 'disabled'}.`, 'success');
      },
      error: () => {
        this.showToast('Failed to update newsletter toggle.', 'error');
      }
    });
  }

  loadStats(): void {
    this.statsLoading = true;
    this.api.getNewsletterStats().subscribe({
      next: (data: any) => {
        this.subscriberCount = data.subscribers;
        this.activeUserCount = data.activeUsers;
        this.totalUsers = data.totalUsers;
        this.statsLoading = false;
      },
      error: () => { this.statsLoading = false; }
    });
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.api.getUsers({
      page: this.page,
      size: this.size,
      email: this.filterEmail || undefined,
      status: 'ACTIVE'
    }).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.users = data;
          this.totalPages = 1;
        } else {
          this.users = data.content;
          this.totalPages = data.totalPages;
        }
        this.usersLoading = false;
      },
      error: () => { this.usersLoading = false; }
    });
  }

  applyFilter(): void {
    this.page = 0;
    this.loadUsers();
  }

  clearFilter(): void {
    this.filterEmail = '';
    this.page = 0;
    this.loadUsers();
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.loadUsers();
    }
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.page - 2);
    const end = Math.min(this.totalPages - 1, this.page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  toggleSelect(email: string): void {
    if (this.selectedEmails.has(email)) {
      this.selectedEmails.delete(email);
    } else {
      this.selectedEmails.add(email);
    }
    this.selectAll = this.selectedEmails.size === this.users.length && this.users.length > 0;
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedEmails.clear();
      this.selectAll = false;
    } else {
      this.users.forEach(u => this.selectedEmails.add(u.email));
      this.selectAll = true;
    }
  }

  isSelected(email: string): boolean {
    return this.selectedEmails.has(email);
  }

  get recipientLabel(): string {
    switch (this.target) {
      case 'subscribers': return `${this.subscriberCount} newsletter subscriber${this.subscriberCount !== 1 ? 's' : ''}`;
      case 'active': return `${this.activeUserCount} active user${this.activeUserCount !== 1 ? 's' : ''}`;
      case 'selected': return `${this.selectedEmails.size} selected user${this.selectedEmails.size !== 1 ? 's' : ''}`;
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        this.attachments.push(input.files[i]);
      }
      input.value = '';
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  sendEmail(): void {
    if (!this.emailSubject.trim() || !this.emailBody.trim()) {
      this.showToast('Please enter both a subject and message body.', 'error');
      return;
    }
    if (this.target === 'selected' && this.selectedEmails.size === 0) {
      this.showToast('Please select at least one recipient.', 'error');
      return;
    }

    this.sending = true;
    const payload: any = {
      subject: this.emailSubject,
      body: this.emailBody,
      target: this.target,
    };
    if (this.target === 'selected') {
      payload.emails = Array.from(this.selectedEmails);
    }

    this.api.sendEmail(payload, this.attachments.length > 0 ? this.attachments : undefined).subscribe({
      next: (res: any) => {
        this.showToast(`Email sent to ${res.sent} recipient${res.sent !== 1 ? 's' : ''}.`, 'success');
        this.emailSubject = '';
        this.emailBody = '';
        this.attachments = [];
        this.sending = false;
      },
      error: () => {
        this.showToast('Failed to send email. Please try again.', 'error');
        this.sending = false;
      }
    });
  }

  showToast(message: string, type: string = 'info'): void {
    const toast = { message, type };
    this.toasts.push(toast);
    setTimeout(() => {
      const idx = this.toasts.indexOf(toast);
      if (idx > -1) this.toasts.splice(idx, 1);
    }, 4000);
  }
}
