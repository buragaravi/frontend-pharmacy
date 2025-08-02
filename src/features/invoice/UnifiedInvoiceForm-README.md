# UnifiedInvoiceForm Component

This component combines the functionality of both `InvoiceForm.jsx` and `InvoiceOtherProductsForm.jsx` into a single, unified invoice creation form.

## Features

### 1. Category Support
- **Chemical**: Includes fields like CAS number, purity, molecular formula, etc.
- **Glassware**: Includes material, capacity, dimensions, etc.
- **Equipment**: Includes model, serial number, calibration dates, etc.
- **Others**: Includes general product specifications

### 2. Dynamic Field Rendering
- Fields change based on selected category
- Category-specific validation
- Auto-calculation of total prices

### 3. Vendor Management
- Dropdown populated from API (`/api/vendors`)
- Search and selection functionality

### 4. Voucher ID Integration
- Auto-fetches next voucher ID from API (`/api/vouchers/next?category=invoice`)
- Displays voucher ID in read-only field
- Refreshes after successful submission

### 5. Product Search & Auto-fill
- Datalist integration for product suggestions
- Auto-fill product details on blur when match found
- Searches from available products for current category

### 6. File Upload (CSV/Excel)
- Drag & drop interface
- Support for `.xlsx`, `.xls`, and `.csv` files
- Template download functionality
- Auto-mapping of columns to fields

### 7. Draft Management
- Save drafts to localStorage
- Load previously saved drafts
- Delete unwanted drafts
- Draft mode indicator

### 8. Product Registration
- Modal form for registering new products
- Category-specific fields
- API integration (`/api/products`)
- Refreshes available products after registration

### 9. Form Validation
- Required field validation
- Numeric validation for quantities and prices
- Real-time error display

### 10. API Integration
- **Vendors**: `GET /api/vendors`
- **Products**: `GET /api/products/category/{category}`
- **Voucher ID**: `GET /api/vouchers/next?category=invoice`
- **Submit Invoice**: `POST /api/invoices`
- **Register Product**: `POST /api/products`

## Usage

```jsx
import UnifiedInvoiceForm from './features/invoice/UnifiedInvoiceForm';

function App() {
  return <UnifiedInvoiceForm />;
}
```

## State Management

The component manages multiple state objects:
- `formData`: Basic invoice information
- `items`: Array of product items
- `vendors`: Available vendors from API
- `availableProducts`: Products for current category
- `savedDrafts`: Draft invoices stored locally
- `newProduct`: Product registration form data

## UI Features

- Responsive design with Tailwind CSS
- Loading states and error handling
- Toast notifications for user feedback
- Modern card-based layout
- Icon integration (react-icons/fi)

## Dependencies

- React hooks (useState, useEffect, useRef)
- react-toastify for notifications
- react-icons/fi for icons
- xlsx for Excel/CSV processing
- axios for API calls

## Notes

- All original features from both `InvoiceForm.jsx` and `InvoiceOtherProductsForm.jsx` are preserved
- The component is fully self-contained
- localStorage is used for draft persistence
- Error boundary recommended for production use
