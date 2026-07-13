import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AUTHOR_PROFILE, isConfiguredAuthorValue } from '../../core/author-profile.config';

@Component({
  selector: 'docs-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="about">
      <nav class="about__breadcrumb" aria-label="Breadcrumb"><a routerLink="/">Docs</a><span>/</span><span>About</span></nav>
      <section class="about__hero">
        @if (avatar()) {
          <img [src]="avatar()" [alt]="displayName() + ' avatar'" />
        } @else {
          <div class="about__avatar-placeholder" aria-hidden="true">{{ initials() }}</div>
        }
        <div>
          <span class="about__eyebrow">Project author</span>
          <h1>{{ displayName() }}</h1>
          <p class="about__handle">&#64;{{ profile.authorHandle }}</p>
          @if (title()) { <p class="about__title">{{ title() }}</p> }
          @if (location()) { <p class="about__location">{{ location() }}</p> }
        </div>
      </section>

      <div class="about__grid">
        <section>
          <h2>About the author</h2>
          @if (bio()) {
            <p>{{ bio() }}</p>
          } @else {
            <p>Author biography has not been configured yet. Update the central author profile when verified information is available.</p>
          }
          @if (profile.technicalFocus.length) {
            <h3>Technical focus</h3>
            <ul>@for (focus of profile.technicalFocus; track focus) { <li>{{ focus }}</li> }</ul>
          }
          @if (profile.motivation) { <h3>Motivation behind SDCoreJS</h3><p>{{ profile.motivation }}</p> }
          @if (profile.projectPrinciples.length) {
            <h3>Project principles</h3>
            <ul>@for (principle of profile.projectPrinciples; track principle) { <li>{{ principle }}</li> }</ul>
          }
        </section>

        <aside>
          <h2>Links</h2>
          <a [href]="profile.githubUrl" target="_blank" rel="noreferrer" aria-label="Open sdcorejs on GitHub">GitHub</a>
          @if (linkedin()) { <a [href]="linkedin()" target="_blank" rel="noreferrer" aria-label="Open author LinkedIn profile">LinkedIn</a> }
          @if (website()) { <a [href]="website()" target="_blank" rel="noreferrer" aria-label="Open author website">Website</a> }
          @if (email()) { <a [href]="'mailto:' + email()" aria-label="Email the author">Email</a> }
          <a href="https://github.com/sdcorejs/sdcorejs-angular" target="_blank" rel="noreferrer">Source repository</a>
          <a href="https://www.npmjs.com/package/@sdcorejs/angular" target="_blank" rel="noreferrer">npm package</a>
        </aside>
      </div>

      <section class="about__contribute">
        <h2>Contribute and support</h2>
        <p>Use GitHub issues for verified bug reports and focused feature proposals. Pull requests should preserve the v19 source-of-truth and multi-version sync workflow.</p>
        <a href="https://github.com/sdcorejs/sdcorejs-angular/issues" target="_blank" rel="noreferrer">Open GitHub issues</a>
      </section>
    </main>
  `,
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  readonly profile = AUTHOR_PROFILE;
  readonly displayName = computed(() => isConfiguredAuthorValue(this.profile.authorName) ? this.profile.authorName : this.profile.authorHandle);
  readonly initials = computed(() => this.displayName().slice(0, 2).toLocaleUpperCase());
  readonly avatar = computed(() => isConfiguredAuthorValue(this.profile.avatar) ? this.profile.avatar : null);
  readonly title = computed(() => isConfiguredAuthorValue(this.profile.authorTitle) ? this.profile.authorTitle : null);
  readonly bio = computed(() => isConfiguredAuthorValue(this.profile.authorBio) ? this.profile.authorBio : null);
  readonly location = computed(() => isConfiguredAuthorValue(this.profile.location) ? this.profile.location : null);
  readonly linkedin = computed(() => isConfiguredAuthorValue(this.profile.linkedinUrl) ? this.profile.linkedinUrl : null);
  readonly website = computed(() => isConfiguredAuthorValue(this.profile.websiteUrl) ? this.profile.websiteUrl : null);
  readonly email = computed(() => isConfiguredAuthorValue(this.profile.email) ? this.profile.email : null);
}
