import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-autocomplete-field',
  templateUrl: './autocomplete-field.component.html',
  styleUrls: ['./autocomplete-field.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteFieldComponent),
      multi: true
    }
  ]
})
export class AutocompleteFieldComponent implements OnInit, ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() searchFunction!: (text: string) => Observable<any[]>;
  @Input() displayField: string = 'nombre';
  @Input() valueField: string = 'id';
  @Input() allowCustom: boolean = true;
  @Input() showCreateButton: boolean = true;
  @Input() disabled: boolean = false;
  
  @Output() itemSelected = new EventEmitter<any>();
  @Output() createNew = new EventEmitter<void>();

  value: any = null;
  searchText: string = '';
  filteredItems: any[] = [];
  isSearching: boolean = false;
  showDropdown: boolean = false;
  
  private searchSubject = new Subject<string>();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(text => {
        if (!text || text.length < 2) {
          this.filteredItems = [];
          return [];
        }
        this.isSearching = true;
        return this.searchFunction(text);
      })
    ).subscribe({
      next: (items) => {
        this.filteredItems = items || [];
        this.isSearching = false;
        this.showDropdown = this.filteredItems.length > 0;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.isSearching = false;
        this.filteredItems = [];
      }
    });
  }

  onSearchInput(event: any) {
    const text = event.target.value;
    this.searchText = text;
    this.searchSubject.next(text);
    
    if (!text) {
      this.filteredItems = [];
      this.showDropdown = false;
      this.value = null;
      this.onChange(null);
    }
  }

  selectItem(item: any) {
    this.value = item;
    this.searchText = item[this.displayField];
    this.showDropdown = false;
    this.onChange(item[this.valueField]);
    this.itemSelected.emit(item);
  }

  createNewItem() {
    this.createNew.emit();
    this.showDropdown = false;
  }

  onFocus() {
    if (this.searchText && this.filteredItems.length > 0) {
      this.showDropdown = true;
    }
  }

  onBlur() {
    // Delay para permitir que se ejecute el click en el dropdown
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
    if (value && typeof value === 'object') {
      this.searchText = value[this.displayField] || '';
    } else if (value) {
      // Si es solo el ID, necesitaríamos buscar el objeto completo
      this.searchText = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
