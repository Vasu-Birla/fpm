<!-- Header Start -->
<?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
<?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
    
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- row start -->
        <div class="row justify-content-center">
            <div class="col-lg-12">
                <!-- page header start -->
                <div class="mb-4">
                    <h5 class="fw-bold mb-0 d-flex align-items-center"> 
                        <a href="paymentreceipt-list.php" class="text-dark"> 
                            <i class="ti ti-chevron-left me-1"></i>Edit Payment Receipt
                        </a>
                    </h5>
                </div>
                <!-- page header end -->

                <div class="card">
                    <div class="card-body">
                        <form action="#" method="POST" enctype="multipart/form-data">
                            <div class="row">

                                <div class="col-md-6 mb-3">
                                    <label for="client_name" class="form-label">Client Name</label>
                                    <input type="text" id="client_name" name="client_name" class="form-control" placeholder="Enter Client Name" value="John Doe" required>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="invoice_number" class="form-label">Invoice #</label>
                                    <input 
                                        type="text" 
                                        id="invoice_number" 
                                        name="invoice_number" 
                                        class="form-control" 
                                        placeholder="Enter Invoice Number" 
                                        value="INV-2025-001" 
                                        required
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="payment_mode" class="form-label">Payment Mode</label>
                                    <select 
                                        id="payment_mode" 
                                        name="payment_mode" 
                                        class="form-control" 
                                        required
                                    >
                                        <option value="">Select Payment Mode</option>
                                        <option>Cash</option>
                                        <option selected>Cheque</option>
                                        <option>Transfer</option>
                                    </select>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="amount" class="form-label">Amount</label>
                                    <input 
                                        type="number" 
                                        id="amount" 
                                        name="amount" 
                                        class="form-control" 
                                        placeholder="Enter Amount" 
                                        value="25000" 
                                        required
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="payment_date" class="form-label">Date</label>
                                    <input 
                                        type="date" 
                                        id="payment_date" 
                                        name="payment_date" 
                                        class="form-control" 
                                        value="2025-10-30" 
                                        required
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="upload_receipt" class="form-label">Upload Receipt</label>
                                    <input 
                                        type="file" 
                                        id="upload_receipt" 
                                        name="upload_receipt" 
                                        class="form-control"
                                    >
                                    <small class="text-muted">Current: receipt_25000.pdf</small>
                                </div>

                                <div class="col-md-12 mb-3">
                                    <label for="remarks" class="form-label">Remarks</label>
                                    <textarea 
                                        id="remarks" 
                                        name="remarks" 
                                        class="form-control" 
                                        rows="3" 
                                        placeholder="Enter Remarks"
                                        required
                                    >Payment cleared via cheque.</textarea>
                                </div>

                            </div>

                            <div class="d-flex align-items-center justify-content-end">
                                <a href="paymentreceipt-list.php" class="btn btn-light me-2">Cancel</a>
                                <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Update Payment Receipt</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
        <!-- row end -->               
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
<?php include ('footer.php'); ?>
<!-- Footer End -->
